-- =============================================================================
-- MIGRATION 009 — Triggers de sincronização cross-table
-- Portal: Hermida Maia Advocacia — Superendividamento CNJ
-- =============================================================================
-- REGRAS ABSOLUTAS: CREATE OR REPLACE, sem DROP TABLE ou RENAME
-- OBJETIVO:
--   1. portal_casos → re_users: quando caso atualizado, sincroniza re_users
--   2. portal_documentos → re_documents: sincroniza status de documentos
--   3. portal_casos: auto-registra evento na timeline quando fase muda
--   4. portal_casos: auto-notifica quando onboarding_done = true pela 1ª vez
-- =============================================================================

-- ─── 1. Sync portal_casos → re_users ────────────────────────────────────────
-- Quando portal_casos.re_user_id for preenchido ou full_name/cpf mudarem,
-- atualiza o registro correspondente em re_users.

CREATE OR REPLACE FUNCTION _sync_portal_caso_to_re_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Só sincroniza se re_user_id estiver definido
  IF NEW.re_user_id IS NOT NULL THEN
    UPDATE re_users
    SET
      portal_caso_id = NEW.id,
      cpf            = COALESCE(NEW.cpf,       re_users.cpf),
      name           = COALESCE(NEW.full_name,  re_users.name),
      updated_at     = now()
    WHERE id = NEW.re_user_id;
  END IF;

  -- Ponteiro reverso: popula re_user_id a partir de re_users se email bater
  IF NEW.re_user_id IS NULL THEN
    UPDATE portal_casos
    SET re_user_id = (
      SELECT ru.id FROM re_users ru
      JOIN auth.users au ON au.id = NEW.user_id
      WHERE ru.email = au.email
      LIMIT 1
    )
    WHERE id = NEW.id
      AND re_user_id IS NULL;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION _sync_portal_caso_to_re_user()
  IS 'AFTER INSERT/UPDATE: sincroniza portal_casos ↔ re_users via re_user_id';

DROP TRIGGER IF EXISTS trg_sync_caso_to_re_user ON portal_casos;
CREATE TRIGGER trg_sync_caso_to_re_user
  AFTER INSERT OR UPDATE OF re_user_id, full_name, cpf
  ON portal_casos
  FOR EACH ROW
  EXECUTE FUNCTION _sync_portal_caso_to_re_user();

-- ─── 2. Sync portal_documentos → re_documents ───────────────────────────────
-- Quando o status de um documento muda, propaga para re_documents se vinculado.

CREATE OR REPLACE FUNCTION _sync_portal_doc_to_re_doc()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.re_document_id IS NOT NULL
     AND (TG_OP = 'INSERT' OR NEW.status IS DISTINCT FROM OLD.status) THEN
    UPDATE re_documents
    SET
      status     = NEW.status,
      updated_at = now()
    WHERE id = NEW.re_document_id;
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION _sync_portal_doc_to_re_doc()
  IS 'AFTER INSERT/UPDATE OF status: propaga status do documento para re_documents';

DROP TRIGGER IF EXISTS trg_sync_portal_doc_status ON portal_documentos;
CREATE TRIGGER trg_sync_portal_doc_status
  AFTER INSERT OR UPDATE OF status
  ON portal_documentos
  FOR EACH ROW
  EXECUTE FUNCTION _sync_portal_doc_to_re_doc();

-- ─── 3. Auto-timeline: evento gerado quando fase muda ────────────────────────
-- Append-only: cada mudança de fase gera um evento na portal_cnj_timeline.

CREATE OR REPLACE FUNCTION _auto_timeline_fase_alterada()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fase_label_map jsonb := '{
    "cadastro":    "Cadastro",
    "analise":     "Em Análise",
    "conciliacao": "Conciliação",
    "judicial":    "Judicial",
    "encerrado":   "Encerrado"
  }'::jsonb;
  nova_desc text;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.fase IS DISTINCT FROM OLD.fase THEN
    nova_desc := format(
      'Caso avançou para a fase "%s".',
      COALESCE(fase_label_map->>NEW.fase, NEW.fase)
    );

    INSERT INTO portal_cnj_timeline (
      caso_id,
      workspace_id,
      evento_tipo,
      evento_subtipo,
      descricao,
      payload,
      author_role,
      is_visible_client
    ) VALUES (
      NEW.id,
      NEW.workspace_id,
      'fase_alterada',
      NEW.fase,
      nova_desc,
      jsonb_build_object(
        'fase_anterior', OLD.fase,
        'fase_nova',     NEW.fase,
        'proxima_acao',  NEW.proxima_acao
      ),
      'system',
      true
    );
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION _auto_timeline_fase_alterada()
  IS 'AFTER UPDATE: insere evento fase_alterada na portal_cnj_timeline automaticamente';

DROP TRIGGER IF EXISTS trg_auto_timeline_fase ON portal_casos;
CREATE TRIGGER trg_auto_timeline_fase
  AFTER UPDATE OF fase
  ON portal_casos
  FOR EACH ROW
  EXECUTE FUNCTION _auto_timeline_fase_alterada();

-- ─── 4. Auto-timeline: onboarding concluído ──────────────────────────────────
-- Quando onboarding_done muda de false para true, registra evento.

CREATE OR REPLACE FUNCTION _auto_timeline_onboarding_done()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.onboarding_done = true
     AND OLD.onboarding_done = false THEN

    INSERT INTO portal_cnj_timeline (
      caso_id,
      workspace_id,
      evento_tipo,
      descricao,
      payload,
      author_role,
      is_visible_client
    ) VALUES (
      NEW.id,
      NEW.workspace_id,
      'formulario_enviado',
      'Formulário CNJ 7 passos concluído e enviado ao escritório.',
      jsonb_build_object(
        'cnj_step_final', NEW.cnj_step_atual,
        'n_credores',     NEW.n_credores,
        'onboarding_at',  now()
      ),
      'system',
      true
    );
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION _auto_timeline_onboarding_done()
  IS 'AFTER UPDATE: insere evento formulario_enviado quando onboarding_done vai de false → true';

DROP TRIGGER IF EXISTS trg_auto_timeline_onboarding ON portal_casos;
CREATE TRIGGER trg_auto_timeline_onboarding
  AFTER UPDATE OF onboarding_done
  ON portal_casos
  FOR EACH ROW
  EXECUTE FUNCTION _auto_timeline_onboarding_done();

-- ─── 5. Auto-notificação: pendência de documentos ────────────────────────────
-- Quando documento é recusado, insere notificação na fila.

CREATE OR REPLACE FUNCTION _auto_notify_doc_recusado()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caso     portal_casos%ROWTYPE;
  v_email    text;
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.status = 'recusado'
     AND OLD.status IS DISTINCT FROM NEW.status THEN

    SELECT * INTO v_caso FROM portal_casos WHERE user_id = NEW.user_id LIMIT 1;
    SELECT email INTO v_email FROM auth.users WHERE id = NEW.user_id LIMIT 1;

    IF v_email IS NOT NULL THEN
      INSERT INTO portal_cnj_notifications (
        caso_id,
        workspace_id,
        recipient_uid,
        recipient_email,
        canal,
        assunto,
        template_key,
        template_vars,
        status
      ) VALUES (
        v_caso.id,
        v_caso.workspace_id,
        NEW.user_id,
        v_email,
        'email',
        'Documento recusado — ação necessária',
        'doc_recusado',
        jsonb_build_object(
          'tipo',          NEW.tipo,
          'observacao',    COALESCE(NEW.observacao_admin, NEW.observacao, ''),
          'full_name',     COALESCE(v_caso.full_name, '')
        ),
        'pendente'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION _auto_notify_doc_recusado()
  IS 'AFTER UPDATE: quando documento é recusado, cria notificação de email para o cliente';

DROP TRIGGER IF EXISTS trg_auto_notify_doc_recusado ON portal_documentos;
CREATE TRIGGER trg_auto_notify_doc_recusado
  AFTER UPDATE OF status
  ON portal_documentos
  FOR EACH ROW
  EXECUTE FUNCTION _auto_notify_doc_recusado();

-- =============================================================================
-- REVERSÃO:
-- DROP TRIGGER IF EXISTS trg_sync_caso_to_re_user      ON portal_casos;
-- DROP TRIGGER IF EXISTS trg_sync_portal_doc_status    ON portal_documentos;
-- DROP TRIGGER IF EXISTS trg_auto_timeline_fase        ON portal_casos;
-- DROP TRIGGER IF EXISTS trg_auto_timeline_onboarding  ON portal_casos;
-- DROP TRIGGER IF EXISTS trg_auto_notify_doc_recusado  ON portal_documentos;
-- DROP FUNCTION IF EXISTS _sync_portal_caso_to_re_user();
-- DROP FUNCTION IF EXISTS _sync_portal_doc_to_re_doc();
-- DROP FUNCTION IF EXISTS _auto_timeline_fase_alterada();
-- DROP FUNCTION IF EXISTS _auto_timeline_onboarding_done();
-- DROP FUNCTION IF EXISTS _auto_notify_doc_recusado();
-- =============================================================================
