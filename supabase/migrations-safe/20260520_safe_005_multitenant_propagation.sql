-- =============================================================================
-- MIGRATION 005 — Multi-tenant workspace_id propagation
-- Portal: Hermida Maia Advocacia — Superendividamento CNJ
-- Lei 14.181/2021 + Recomendação CNJ 125/2021
-- =============================================================================
-- REGRAS ABSOLUTAS:
--   ✗ NÃO faz DROP, RENAME ou remoção de colunas
--   ✓ Usa ADD COLUMN IF NOT EXISTS (nullable)
--   ✓ Backfill não-blocante via UPDATE com filtro
--   ✓ Reversível: DROP COLUMN, DROP TRIGGER
-- =============================================================================
-- OBJETIVO: Completar multi-tenant em portal_dividas e portal_documentos.
--   portal_casos já tem workspace_id. Dividas e documentos não têm.
--   Esta migration adiciona o campo e auto-propaga via trigger.
-- =============================================================================

-- ─── 1. Adicionar workspace_id em portal_dividas ────────────────────────────
ALTER TABLE portal_dividas
  ADD COLUMN IF NOT EXISTS workspace_id uuid
  REFERENCES portal_workspaces(id) ON DELETE SET NULL;

COMMENT ON COLUMN portal_dividas.workspace_id
  IS 'Multi-tenant: copiado de portal_casos.workspace_id no INSERT via trigger';

-- ─── 2. Adicionar workspace_id em portal_documentos ─────────────────────────
ALTER TABLE portal_documentos
  ADD COLUMN IF NOT EXISTS workspace_id uuid
  REFERENCES portal_workspaces(id) ON DELETE SET NULL;

COMMENT ON COLUMN portal_documentos.workspace_id
  IS 'Multi-tenant: copiado de portal_casos.workspace_id no INSERT via trigger';

-- ─── 3. Backfill via caso_id (FK direta, mais precisa) ───────────────────────
UPDATE portal_dividas pd
SET    workspace_id = pc.workspace_id
FROM   portal_casos pc
WHERE  pd.caso_id       = pc.id
  AND  pd.workspace_id  IS NULL
  AND  pc.workspace_id  IS NOT NULL;

UPDATE portal_documentos pdoc
SET    workspace_id = pc.workspace_id
FROM   portal_casos pc
WHERE  pdoc.caso_id      = pc.id
  AND  pdoc.workspace_id IS NULL
  AND  pc.workspace_id   IS NOT NULL;

-- ─── 4. Backfill via user_id (para registros sem caso_id) ────────────────────
UPDATE portal_dividas pd
SET    workspace_id = pc.workspace_id
FROM   portal_casos pc
WHERE  pd.user_id       = pc.user_id
  AND  pd.workspace_id  IS NULL
  AND  pc.workspace_id  IS NOT NULL;

UPDATE portal_documentos pdoc
SET    workspace_id = pc.workspace_id
FROM   portal_casos pc
WHERE  pdoc.user_id      = pc.user_id
  AND  pdoc.workspace_id IS NULL
  AND  pc.workspace_id   IS NOT NULL;

-- ─── 5. Função de propagação automática ─────────────────────────────────────
CREATE OR REPLACE FUNCTION _propagate_workspace_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Só propaga se workspace_id ainda não foi fornecido
  IF NEW.workspace_id IS NULL THEN
    SELECT workspace_id INTO NEW.workspace_id
    FROM   portal_casos
    WHERE  user_id = NEW.user_id
    LIMIT  1;
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION _propagate_workspace_id()
  IS 'BEFORE INSERT trigger: herda workspace_id de portal_casos quando não fornecido';

-- ─── 6. Triggers ─────────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_propagate_workspace_dividas    ON portal_dividas;
DROP TRIGGER IF EXISTS trg_propagate_workspace_documentos ON portal_documentos;

CREATE TRIGGER trg_propagate_workspace_dividas
  BEFORE INSERT ON portal_dividas
  FOR EACH ROW EXECUTE FUNCTION _propagate_workspace_id();

CREATE TRIGGER trg_propagate_workspace_documentos
  BEFORE INSERT ON portal_documentos
  FOR EACH ROW EXECUTE FUNCTION _propagate_workspace_id();

-- ─── 7. Índices para performance de RLS ─────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_portal_dividas_workspace_id
  ON portal_dividas(workspace_id)
  WHERE workspace_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_portal_documentos_workspace_id
  ON portal_documentos(workspace_id)
  WHERE workspace_id IS NOT NULL;

-- ─── 8. Atualizar RLS de portal_dividas para incluir workspace ───────────────
-- (Additive: adiciona política paralela — não remove as existentes)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'portal_dividas'
      AND policyname = 'workspace_admin_dividas'
  ) THEN
    EXECUTE $p$
      CREATE POLICY workspace_admin_dividas ON portal_dividas
        FOR ALL TO authenticated
        USING (
          -- Admin do workspace pode ver todos os registros do workspace
          workspace_id = ANY(my_workspace_ids())
          AND is_any_admin()
        );
    $p$;
  END IF;
END $$;

-- ─── 9. Atualizar RLS de portal_documentos para incluir workspace ─────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'portal_documentos'
      AND policyname = 'workspace_admin_documentos'
  ) THEN
    EXECUTE $p$
      CREATE POLICY workspace_admin_documentos ON portal_documentos
        FOR ALL TO authenticated
        USING (
          workspace_id = ANY(my_workspace_ids())
          AND is_any_admin()
        );
    $p$;
  END IF;
END $$;

-- =============================================================================
-- REVERSÃO (executar em caso de rollback):
-- ALTER TABLE portal_dividas    DROP COLUMN IF EXISTS workspace_id;
-- ALTER TABLE portal_documentos DROP COLUMN IF EXISTS workspace_id;
-- DROP TRIGGER IF EXISTS trg_propagate_workspace_dividas    ON portal_dividas;
-- DROP TRIGGER IF EXISTS trg_propagate_workspace_documentos ON portal_documentos;
-- DROP FUNCTION IF EXISTS _propagate_workspace_id();
-- =============================================================================
