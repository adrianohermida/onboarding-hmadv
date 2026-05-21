-- =============================================================================
-- MIGRATION 013 — CRUD operacional jurídico multi-módulo
-- Portal: Hermida Maia Advocacia
-- =============================================================================
-- Objetivo:
--   Persistir registros operacionais do advogado para módulos sem tabela
--   especializada própria, com RLS, auditoria, arquivamento e exclusão lógica.
-- =============================================================================

CREATE TABLE IF NOT EXISTS portal_operational_records (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid REFERENCES portal_workspaces(id) ON DELETE SET NULL,
  module_key    text NOT NULL,
  status        text NOT NULL DEFAULT 'ativo',
  record_data   jsonb NOT NULL DEFAULT '{}',
  archived_at   timestamptz,
  deleted_at    timestamptz,
  created_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_portal_operational_records_module
  ON portal_operational_records(module_key, deleted_at, archived_at);

CREATE INDEX IF NOT EXISTS idx_portal_operational_records_workspace
  ON portal_operational_records(workspace_id) WHERE workspace_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_portal_operational_records_data_gin
  ON portal_operational_records USING gin(record_data);

DROP TRIGGER IF EXISTS trg_portal_operational_records_updated_at ON portal_operational_records;
CREATE TRIGGER trg_portal_operational_records_updated_at
  BEFORE UPDATE ON portal_operational_records
  FOR EACH ROW EXECUTE FUNCTION _set_updated_at();

ALTER TABLE portal_operational_records ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename='portal_operational_records'
      AND policyname='admin_operational_records_all'
  ) THEN
    CREATE POLICY admin_operational_records_all
      ON portal_operational_records
      FOR ALL TO authenticated
      USING (is_any_admin())
      WITH CHECK (is_any_admin());
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS portal_operational_record_audit (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id   uuid REFERENCES portal_operational_records(id) ON DELETE CASCADE,
  module_key  text NOT NULL,
  action      text NOT NULL,
  payload     jsonb NOT NULL DEFAULT '{}',
  actor_uid   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_portal_operational_record_audit_record
  ON portal_operational_record_audit(record_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_portal_operational_record_audit_module
  ON portal_operational_record_audit(module_key, created_at DESC);

ALTER TABLE portal_operational_record_audit ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename='portal_operational_record_audit'
      AND policyname='admin_operational_record_audit_all'
  ) THEN
    CREATE POLICY admin_operational_record_audit_all
      ON portal_operational_record_audit
      FOR ALL TO authenticated
      USING (is_any_admin())
      WITH CHECK (is_any_admin());
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE ON portal_operational_records TO authenticated;
GRANT SELECT, INSERT ON portal_operational_record_audit TO authenticated;

COMMENT ON TABLE portal_operational_records
  IS 'Registros operacionais multi-módulo do workspace jurídico: clientes locais, planos, tarefas, agenda, mensagens e processos.';

COMMENT ON TABLE portal_operational_record_audit
  IS 'Auditoria/timeline dos registros operacionais multi-módulo.';
