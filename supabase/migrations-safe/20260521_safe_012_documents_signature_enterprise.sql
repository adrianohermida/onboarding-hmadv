-- =============================================================================
-- MIGRATION 012 — Documentos enterprise + Autentique signatures
-- Portal: Hermida Maia Advocacia — Superendividamento CNJ
-- =============================================================================
-- Idempotente e não destrutiva: apenas ADD COLUMN IF NOT EXISTS, CREATE IF NOT
-- EXISTS e CREATE OR REPLACE.
-- =============================================================================

-- ─── 1. Campos consumidos pelo módulo /modules/documents ─────────────────────
ALTER TABLE portal_documentos
  ADD COLUMN IF NOT EXISTS workflow_status    text NOT NULL DEFAULT 'pendente_envio',
  ADD COLUMN IF NOT EXISTS category           text,
  ADD COLUMN IF NOT EXISTS admin_notes        text,
  ADD COLUMN IF NOT EXISTS deadline           timestamptz,
  ADD COLUMN IF NOT EXISTS require_signature  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS autentique_id      text,
  ADD COLUMN IF NOT EXISTS autentique_status  text,
  ADD COLUMN IF NOT EXISTS signed_file_url    text,
  ADD COLUMN IF NOT EXISTS version            integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS file_size          bigint,
  ADD COLUMN IF NOT EXISTS mime_type          text,
  ADD COLUMN IF NOT EXISTS direction          text NOT NULL DEFAULT 'client_to_office',
  ADD COLUMN IF NOT EXISTS tags               text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS uploaded_by        uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS deleted_at         timestamptz;

CREATE INDEX IF NOT EXISTS idx_portal_docs_workflow_status
  ON portal_documentos(workflow_status);

CREATE INDEX IF NOT EXISTS idx_portal_docs_autentique_id
  ON portal_documentos(autentique_id)
  WHERE autentique_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_portal_docs_not_deleted
  ON portal_documentos(user_id, workflow_status)
  WHERE deleted_at IS NULL;

COMMENT ON COLUMN portal_documentos.workflow_status
  IS 'Workflow documental enterprise: pendente_envio|enviado|recebido|em_analise|pendente_correcao|aprovado|rejeitado|aguardando_assinatura|assinado|arquivado';
COMMENT ON COLUMN portal_documentos.autentique_id
  IS 'ID do documento/processo no Autentique v2';
COMMENT ON COLUMN portal_documentos.direction
  IS 'Fluxo documental: client_to_office ou office_to_client';

-- ─── 2. Solicitações documentais escritório → cliente ───────────────────────
CREATE TABLE IF NOT EXISTS portal_document_requests (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id        uuid REFERENCES portal_workspaces(id) ON DELETE SET NULL,
  caso_id             uuid REFERENCES portal_casos(id) ON DELETE CASCADE,
  user_id             uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_by        uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  tipo                text NOT NULL,
  category            text NOT NULL DEFAULT 'complementares',
  title               text,
  description         text,
  required            boolean NOT NULL DEFAULT true,
  priority            text NOT NULL DEFAULT 'normal',
  deadline            timestamptz,
  status              text NOT NULL DEFAULT 'pending',
  fulfilled_document_id uuid REFERENCES portal_documentos(id) ON DELETE SET NULL,
  fulfilled_at        timestamptz,
  metadata            jsonb NOT NULL DEFAULT '{}',
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_document_requests_user_status
  ON portal_document_requests(user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_document_requests_workspace
  ON portal_document_requests(workspace_id, status)
  WHERE workspace_id IS NOT NULL;

DROP TRIGGER IF EXISTS trg_document_requests_updated_at ON portal_document_requests;
CREATE TRIGGER trg_document_requests_updated_at
  BEFORE UPDATE ON portal_document_requests
  FOR EACH ROW EXECUTE FUNCTION _set_updated_at();

ALTER TABLE portal_document_requests ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'portal_document_requests'
      AND policyname = 'own_document_requests'
  ) THEN
    CREATE POLICY own_document_requests ON portal_document_requests
      FOR SELECT TO authenticated
      USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'portal_document_requests'
      AND policyname = 'admin_document_requests'
  ) THEN
    CREATE POLICY admin_document_requests ON portal_document_requests
      FOR ALL TO authenticated
      USING (is_any_admin())
      WITH CHECK (is_any_admin());
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE ON portal_document_requests TO authenticated;

-- ─── 3. Admin RPC para workflow documental ──────────────────────────────────
CREATE OR REPLACE FUNCTION admin_update_doc_workflow(
  p_doc_id uuid,
  p_workflow_status text,
  p_observacao text DEFAULT NULL,
  p_admin_notes text DEFAULT NULL
)
RETURNS portal_documentos
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_doc portal_documentos%ROWTYPE;
  v_status text;
  v_event text;
  v_desc text;
BEGIN
  IF NOT is_any_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  v_status := CASE p_workflow_status
    WHEN 'aprovado' THEN 'aprovado'
    WHEN 'rejeitado' THEN 'recusado'
    WHEN 'pendente_correcao' THEN 'recusado'
    WHEN 'assinado' THEN 'aprovado'
    WHEN 'aguardando_assinatura' THEN 'aguardando_assinatura'
    WHEN 'arquivado' THEN 'arquivado'
    ELSE 'em_analise'
  END;

  UPDATE portal_documentos
  SET workflow_status = p_workflow_status,
      status           = v_status,
      observacao_admin = COALESCE(p_observacao, observacao_admin),
      admin_notes      = COALESCE(p_admin_notes, admin_notes),
      updated_at       = now()
  WHERE id = p_doc_id
    AND deleted_at IS NULL
  RETURNING * INTO v_doc;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Documento não encontrado';
  END IF;

  v_event := CASE p_workflow_status
    WHEN 'aprovado' THEN 'document.approved'
    WHEN 'rejeitado' THEN 'document.rejected'
    WHEN 'pendente_correcao' THEN 'document.correction_requested'
    WHEN 'aguardando_assinatura' THEN 'signature.requested'
    WHEN 'assinado' THEN 'signature.completed'
    WHEN 'arquivado' THEN 'document.archived'
    ELSE 'document.updated'
  END;

  v_desc := CASE p_workflow_status
    WHEN 'aprovado' THEN 'Documento aprovado pelo escritório.'
    WHEN 'rejeitado' THEN 'Documento rejeitado pelo escritório.'
    WHEN 'pendente_correcao' THEN 'Correção documental solicitada.'
    WHEN 'aguardando_assinatura' THEN 'Documento enviado para assinatura eletrônica.'
    WHEN 'assinado' THEN 'Documento marcado como assinado.'
    WHEN 'arquivado' THEN 'Documento arquivado.'
    ELSE 'Status documental atualizado.'
  END;

  IF v_doc.caso_id IS NOT NULL THEN
    INSERT INTO portal_cnj_timeline (
      caso_id,
      workspace_id,
      documento_id,
      evento_tipo,
      evento_subtipo,
      descricao,
      payload,
      author_role,
      author_uid,
      is_visible_client
    ) VALUES (
      v_doc.caso_id,
      v_doc.workspace_id,
      v_doc.id,
      v_event,
      p_workflow_status,
      v_desc,
      jsonb_build_object(
        'workflow_status', p_workflow_status,
        'observacao', p_observacao,
        'has_admin_notes', p_admin_notes IS NOT NULL
      ),
      'admin',
      auth.uid(),
      p_workflow_status <> 'arquivado'
    );
  END IF;

  RETURN v_doc;
END;
$$;

GRANT EXECUTE ON FUNCTION admin_update_doc_workflow(uuid, text, text, text) TO authenticated;

-- ─── 4. Storage governance: bucket + políticas por usuário/tenant ───────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('portal-documentos', 'portal-documentos', false)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'portal_docs_select_own_or_admin'
  ) THEN
    CREATE POLICY portal_docs_select_own_or_admin ON storage.objects
      FOR SELECT TO authenticated
      USING (
        bucket_id = 'portal-documentos'
        AND (
          owner = auth.uid()
          OR (storage.foldername(name))[1] = auth.uid()::text
          OR (storage.foldername(name))[2] = auth.uid()::text
          OR is_any_admin()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'portal_docs_insert_own_path'
  ) THEN
    CREATE POLICY portal_docs_insert_own_path ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (
        bucket_id = 'portal-documentos'
        AND (
          owner = auth.uid()
          OR (storage.foldername(name))[1] = auth.uid()::text
          OR (storage.foldername(name))[2] = auth.uid()::text
          OR is_any_admin()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'portal_docs_update_own_or_admin'
  ) THEN
    CREATE POLICY portal_docs_update_own_or_admin ON storage.objects
      FOR UPDATE TO authenticated
      USING (
        bucket_id = 'portal-documentos'
        AND (
          owner = auth.uid()
          OR (storage.foldername(name))[1] = auth.uid()::text
          OR (storage.foldername(name))[2] = auth.uid()::text
          OR is_any_admin()
        )
      )
      WITH CHECK (
        bucket_id = 'portal-documentos'
        AND (
          owner = auth.uid()
          OR (storage.foldername(name))[1] = auth.uid()::text
          OR (storage.foldername(name))[2] = auth.uid()::text
          OR is_any_admin()
        )
      );
  END IF;
END $$;

-- ─── 5. Versionamento leve em substituição de arquivo ───────────────────────
CREATE OR REPLACE FUNCTION _increment_doc_version_on_file_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.storage_path IS DISTINCT FROM OLD.storage_path
     AND OLD.storage_path IS NOT NULL THEN
    NEW.version := COALESCE(OLD.version, 1) + 1;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_increment_doc_version ON portal_documentos;
CREATE TRIGGER trg_increment_doc_version
  BEFORE UPDATE OF storage_path ON portal_documentos
  FOR EACH ROW EXECUTE FUNCTION _increment_doc_version_on_file_change();

-- ─── 6. Ajuste de políticas: cliente não vê documentos apagados ─────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'portal_documentos'
      AND policyname = 'own_docs_visible_not_deleted'
  ) THEN
    CREATE POLICY own_docs_visible_not_deleted ON portal_documentos
      FOR SELECT TO authenticated
      USING (user_id = auth.uid() AND deleted_at IS NULL);
  END IF;
END $$;

-- =============================================================================
-- FIM DA MIGRATION 012
-- =============================================================================
