-- Safe 021: Portal schema compatibility for legacy REST queries
-- Goal: make older client requests resilient across environments where
-- portal_* tables may be missing columns/constraints used by frontend filters.

BEGIN;

-- ---------------------------------------------------------------------------
-- portal_casos compatibility
-- ---------------------------------------------------------------------------
ALTER TABLE IF EXISTS portal_casos
  ADD COLUMN IF NOT EXISTS workspace_id uuid,
  ADD COLUMN IF NOT EXISTS numero_processo text,
  ADD COLUMN IF NOT EXISTS onboarding_done boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cnj_step_atual integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cnj_json jsonb,
  ADD COLUMN IF NOT EXISTS fd_ticket_id bigint,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Ensure upsert(on_conflict=user_id) is valid in PostgREST
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'portal_casos' AND column_name = 'user_id')
     AND NOT EXISTS (
       SELECT 1
       FROM pg_constraint c
       JOIN pg_class t ON t.oid = c.conrelid
       JOIN pg_namespace n ON n.oid = t.relnamespace
       WHERE n.nspname = 'public'
         AND t.relname = 'portal_casos'
         AND c.contype = 'u'
         AND c.conkey = ARRAY[
           (SELECT attnum FROM pg_attribute WHERE attrelid = t.oid AND attname = 'user_id' AND NOT attisdropped)
         ]
     ) THEN
    ALTER TABLE public.portal_casos ADD CONSTRAINT portal_casos_user_id_key UNIQUE (user_id);
  END IF;
EXCEPTION
  WHEN duplicate_table THEN NULL;
  WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- portal_custas compatibility
-- ---------------------------------------------------------------------------
ALTER TABLE IF EXISTS portal_custas
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS data_lancamento timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_portal_custas_user_id ON portal_custas(user_id);
CREATE INDEX IF NOT EXISTS idx_portal_custas_deleted_at ON portal_custas(deleted_at);
CREATE INDEX IF NOT EXISTS idx_portal_custas_data_lancamento ON portal_custas(data_lancamento DESC);
CREATE INDEX IF NOT EXISTS idx_portal_custas_created_at ON portal_custas(created_at DESC);

-- ---------------------------------------------------------------------------
-- portal_contratos compatibility
-- ---------------------------------------------------------------------------
ALTER TABLE IF EXISTS portal_contratos
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_portal_contratos_user_id ON portal_contratos(user_id);
CREATE INDEX IF NOT EXISTS idx_portal_contratos_deleted_at ON portal_contratos(deleted_at);
CREATE INDEX IF NOT EXISTS idx_portal_contratos_updated_at ON portal_contratos(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_portal_contratos_created_at ON portal_contratos(created_at DESC);

-- ---------------------------------------------------------------------------
-- Grants (safe idempotent)
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  GRANT SELECT, INSERT, UPDATE ON portal_casos TO authenticated;
EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  GRANT SELECT, INSERT, UPDATE ON portal_custas TO authenticated;
EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  GRANT SELECT, INSERT, UPDATE ON portal_contratos TO authenticated;
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- Keep RLS enabled (if already configured with policies, this remains safe)
ALTER TABLE IF EXISTS portal_casos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS portal_custas ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS portal_contratos ENABLE ROW LEVEL SECURITY;

COMMIT;
