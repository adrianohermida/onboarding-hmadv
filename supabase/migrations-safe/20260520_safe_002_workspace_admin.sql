-- ============================================================
-- MIGRATION SAFE 002 — Multi-tenant + Admin Global
-- Cria portal_workspaces, is_platform_admin helper,
-- funções de autorização e políticas workspace-aware.
-- Nenhuma tabela existente é modificada de forma destrutiva.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. portal_workspaces — tabela canônica multi-tenant do portal
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS portal_workspaces (
  id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT    NOT NULL UNIQUE,          -- identificador URL-safe (ex: hmadv-sp)
  name            TEXT    NOT NULL,                 -- nome exibição (ex: Hermida Maia — SP)
  owner_id        UUID    REFERENCES auth.users(id) ON DELETE SET NULL,
  plan            TEXT    NOT NULL DEFAULT 'standard',  -- standard|premium|enterprise
  status          TEXT    NOT NULL DEFAULT 'active',    -- active|suspended|archived
  settings        JSONB   NOT NULL DEFAULT '{}',
  metadata        JSONB   NOT NULL DEFAULT '{}',
  extra_data      JSONB   NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_portal_workspaces_slug
  ON portal_workspaces (slug);
CREATE INDEX IF NOT EXISTS idx_portal_workspaces_owner_id
  ON portal_workspaces (owner_id);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION _set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_portal_workspaces_updated_at ON portal_workspaces;
CREATE TRIGGER trg_portal_workspaces_updated_at
  BEFORE UPDATE ON portal_workspaces
  FOR EACH ROW EXECUTE FUNCTION _set_updated_at();

COMMENT ON TABLE portal_workspaces IS
  'Unidade multi-tenant do portal. Cada workspace agrupa casos, usuários e contratos.';
COMMENT ON COLUMN portal_workspaces.slug IS 'Identificador URL-safe único (ex: hmadv-sp, hmadv-rj)';
COMMENT ON COLUMN portal_workspaces.tenant_scope IS 'Futura expansão: tenant raiz acima do workspace';

-- ────────────────────────────────────────────────────────────
-- 2. portal_workspace_members — membros por workspace
--    (não quebra nada — tabela nova)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS portal_workspace_members (
  id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID    NOT NULL REFERENCES portal_workspaces(id) ON DELETE CASCADE,
  user_id         UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role            TEXT    NOT NULL DEFAULT 'member',   -- owner|admin|advogado|estagiario|member
  is_active       BOOLEAN NOT NULL DEFAULT true,
  invited_by      UUID    REFERENCES auth.users(id) ON DELETE SET NULL,
  joined_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata        JSONB   NOT NULL DEFAULT '{}',
  UNIQUE (workspace_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_portal_workspace_members_user_id
  ON portal_workspace_members (user_id);
CREATE INDEX IF NOT EXISTS idx_portal_workspace_members_workspace_id
  ON portal_workspace_members (workspace_id);

COMMENT ON TABLE portal_workspace_members IS
  'Membros de cada workspace com seus papéis (RBAC por workspace)';

-- ────────────────────────────────────────────────────────────
-- 3. Workspace padrão HMADV (seed idempotente)
-- ────────────────────────────────────────────────────────────
INSERT INTO portal_workspaces (slug, name, plan, settings, metadata)
VALUES (
  'hmadv-principal',
  'Hermida Maia Advocacia',
  'enterprise',
  '{"timezone": "America/Sao_Paulo", "locale": "pt-BR", "lei_base": "14.181/2021"}',
  '{"criado_por": "migration_safe_002", "obs": "Workspace principal — todos os casos existentes"}'
)
ON CONFLICT (slug) DO NOTHING;

-- Vincula todos os portal_casos sem workspace ao workspace principal
UPDATE portal_casos
SET workspace_id = (SELECT id FROM portal_workspaces WHERE slug = 'hmadv-principal')
WHERE workspace_id IS NULL;

-- ────────────────────────────────────────────────────────────
-- 4. Funções de autorização global
-- ────────────────────────────────────────────────────────────

-- 4a. Verifica se o usuário atual é platform_admin
CREATE OR REPLACE FUNCTION is_platform_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COALESCE(
    (SELECT is_platform_admin FROM admin_profiles
     WHERE id = auth.uid()
       AND is_active = true
       AND is_platform_admin = true
     LIMIT 1),
    false
  );
$$;

COMMENT ON FUNCTION is_platform_admin IS
  'Retorna true se auth.uid() é platform_admin ativo. SECURITY DEFINER para evitar recursão RLS.';

-- 4b. Verifica se o usuário é admin de qualquer nível (legacy + novo)
CREATE OR REPLACE FUNCTION is_any_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT (
    -- Admin legado (admin_users)
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
    OR
    -- Platform admin (admin_profiles)
    is_platform_admin()
    OR
    -- Workspace owner/admin
    EXISTS (
      SELECT 1 FROM portal_workspace_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND is_active = true
    )
  );
$$;

COMMENT ON FUNCTION is_any_admin IS
  'Retorna true para qualquer nível de admin: legado (admin_users), platform_admin ou workspace owner/admin.';

-- 4c. Retorna workspaces autorizados para o usuário atual
CREATE OR REPLACE FUNCTION my_workspace_ids()
RETURNS UUID[] LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT ARRAY(
    SELECT workspace_id
    FROM portal_workspace_members
    WHERE user_id = auth.uid()
      AND is_active = true
  );
$$;

-- ────────────────────────────────────────────────────────────
-- 5. RLS para portal_workspaces
-- ────────────────────────────────────────────────────────────
ALTER TABLE portal_workspaces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workspace_platform_admin_all" ON portal_workspaces;
CREATE POLICY "workspace_platform_admin_all"
  ON portal_workspaces FOR ALL
  USING (is_platform_admin());

DROP POLICY IF EXISTS "workspace_member_select"  ON portal_workspaces;
CREATE POLICY "workspace_member_select"
  ON portal_workspaces FOR SELECT
  USING (id = ANY(my_workspace_ids()));

DROP POLICY IF EXISTS "workspace_owner_update" ON portal_workspaces;
CREATE POLICY "workspace_owner_update"
  ON portal_workspaces FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM portal_workspace_members
      WHERE workspace_id = portal_workspaces.id
        AND user_id = auth.uid()
        AND role = 'owner'
        AND is_active = true
    )
  );

-- ────────────────────────────────────────────────────────────
-- 6. RLS para portal_workspace_members
-- ────────────────────────────────────────────────────────────
ALTER TABLE portal_workspace_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wsm_platform_admin_all"   ON portal_workspace_members;
CREATE POLICY "wsm_platform_admin_all"
  ON portal_workspace_members FOR ALL
  USING (is_platform_admin());

DROP POLICY IF EXISTS "wsm_member_select"        ON portal_workspace_members;
CREATE POLICY "wsm_member_select"
  ON portal_workspace_members FOR SELECT
  USING (workspace_id = ANY(my_workspace_ids()));

-- ────────────────────────────────────────────────────────────
-- 7. Expansão RLS portal_casos: workspace + platform_admin
-- ────────────────────────────────────────────────────────────
-- (as policies existentes "owner" e "admin read all cases" são mantidas)

DROP POLICY IF EXISTS "casos_platform_admin_all"     ON portal_casos;
CREATE POLICY "casos_platform_admin_all"
  ON portal_casos FOR ALL
  USING (is_platform_admin());

DROP POLICY IF EXISTS "casos_workspace_admin_select" ON portal_casos;
CREATE POLICY "casos_workspace_admin_select"
  ON portal_casos FOR SELECT
  USING (
    workspace_id IS NOT NULL
    AND workspace_id = ANY(my_workspace_ids())
    AND EXISTS (
      SELECT 1 FROM portal_workspace_members
      WHERE workspace_id = portal_casos.workspace_id
        AND user_id = auth.uid()
        AND role IN ('owner','admin','advogado','estagiario')
        AND is_active = true
    )
  );

-- ────────────────────────────────────────────────────────────
-- 8. app_config — registra workspace_id do sistema
-- ────────────────────────────────────────────────────────────
INSERT INTO app_config (key, value)
VALUES (
  'portal.default_workspace_id',
  (SELECT to_jsonb(id::text) FROM portal_workspaces WHERE slug = 'hmadv-principal')
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- ────────────────────────────────────────────────────────────
-- DOWN
-- ────────────────────────────────────────────────────────────
-- DROP TABLE IF EXISTS portal_workspace_members;
-- DROP TABLE IF EXISTS portal_workspaces;
-- DROP FUNCTION IF EXISTS is_platform_admin;
-- DROP FUNCTION IF EXISTS is_any_admin;
-- DROP FUNCTION IF EXISTS my_workspace_ids;
-- DROP FUNCTION IF EXISTS _set_updated_at CASCADE;
