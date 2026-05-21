-- =============================================================================
-- MIGRATION 014 — Documentos: comentários, preview e OCR readiness
-- Portal: Hermida Maia Advocacia
-- =============================================================================
-- Não executa OCR. Apenas prepara metadados, comentários e auditoria de preview.
-- =============================================================================

ALTER TABLE portal_documentos
  ADD COLUMN IF NOT EXISTS ocr_status      text NOT NULL DEFAULT 'ready',
  ADD COLUMN IF NOT EXISTS ocr_metadata    jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS preview_metadata jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS last_viewed_at   timestamptz;

COMMENT ON COLUMN portal_documentos.ocr_status
  IS 'OCR readiness: ready|queued|processing|completed|failed. OCR real será integrado em sprint posterior.';

COMMENT ON COLUMN portal_documentos.ocr_metadata
  IS 'Metadados futuros de OCR/classificação automática. Não contém resultado OCR obrigatório no sprint atual.';

CREATE TABLE IF NOT EXISTS portal_document_comments (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      uuid REFERENCES portal_workspaces(id) ON DELETE SET NULL,
  caso_id           uuid REFERENCES portal_casos(id) ON DELETE CASCADE,
  documento_id      uuid NOT NULL REFERENCES portal_documentos(id) ON DELETE CASCADE,
  author_uid        uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  author_role       text NOT NULL DEFAULT 'cliente',
  body              text NOT NULL,
  is_internal       boolean NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_portal_document_comments_doc
  ON portal_document_comments(documento_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_portal_document_comments_case
  ON portal_document_comments(caso_id, created_at DESC)
  WHERE caso_id IS NOT NULL;

DROP TRIGGER IF EXISTS trg_portal_document_comments_updated_at ON portal_document_comments;
CREATE TRIGGER trg_portal_document_comments_updated_at
  BEFORE UPDATE ON portal_document_comments
  FOR EACH ROW EXECUTE FUNCTION _set_updated_at();

ALTER TABLE portal_document_comments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'portal_document_comments'
      AND policyname = 'own_visible_document_comments'
  ) THEN
    CREATE POLICY own_visible_document_comments ON portal_document_comments
      FOR SELECT TO authenticated
      USING (
        is_any_admin()
        OR (
          is_internal = false
          AND EXISTS (
            SELECT 1 FROM portal_documentos d
            WHERE d.id = documento_id
              AND d.user_id = auth.uid()
              AND d.deleted_at IS NULL
          )
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'portal_document_comments'
      AND policyname = 'insert_own_or_admin_document_comments'
  ) THEN
    CREATE POLICY insert_own_or_admin_document_comments ON portal_document_comments
      FOR INSERT TO authenticated
      WITH CHECK (
        is_any_admin()
        OR (
          is_internal = false
          AND EXISTS (
            SELECT 1 FROM portal_documentos d
            WHERE d.id = documento_id
              AND d.user_id = auth.uid()
              AND d.deleted_at IS NULL
          )
        )
      );
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE ON portal_document_comments TO authenticated;

COMMENT ON TABLE portal_document_comments
  IS 'Comentários auditáveis por documento. Clientes veem apenas comentários públicos; admin vê públicos e internos.';
