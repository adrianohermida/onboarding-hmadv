-- =============================================================================
-- MIGRATION 018 — Visibilidade de clientes + convites com isolamento multitenant
-- =============================================================================
-- Objetivo:
-- 1) Garantir que registros legados tenham workspace_id para respeitar RLS por workspace.
-- 2) Garantir membership minimo (member) para clientes com caso existente.
-- 3) Permitir que owner/admin do workspace gerenciem convites/membership.
-- 4) Reforcar admin_get_clients para escopo master + workspace-staff autorizado.
-- =============================================================================

-- Compatibilidade: alguns ambientes ainda nao aplicaram as migrations anteriores
-- que introduzem funcoes de autorizacao. Mantemos fallback idempotente aqui.
CREATE OR REPLACE FUNCTION is_master_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  legacy_admin boolean := false;
  profile_admin boolean := false;
BEGIN
  IF to_regclass('public.admin_users') IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    ) INTO legacy_admin;
  END IF;

  IF to_regclass('public.admin_profiles') IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1
      FROM admin_profiles
      WHERE id = auth.uid()
        AND is_active = true
        AND is_platform_admin = true
    ) INTO profile_admin;
  END IF;

  RETURN COALESCE(legacy_admin OR profile_admin, false);
END;
$$;

CREATE OR REPLACE FUNCTION is_workspace_member_for(
  p_workspace_id uuid,
  p_roles text[] DEFAULT ARRAY['owner','admin','advogado','colaborador','financeiro','estagiario','member']
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    is_master_admin()
    OR EXISTS (
      SELECT 1
      FROM portal_workspace_members pwm
      WHERE pwm.workspace_id = p_workspace_id
        AND pwm.user_id = auth.uid()
        AND pwm.is_active = true
        AND pwm.role = ANY(p_roles)
    ),
    false
  );
$$;

-- 1) Backfill workspace_id em portal_casos quando nulo
DO $$
DECLARE
  default_workspace uuid;
BEGIN
  SELECT id INTO default_workspace
  FROM portal_workspaces
  WHERE slug = 'hmadv-principal'
  LIMIT 1;

  IF default_workspace IS NOT NULL THEN
    UPDATE portal_casos
    SET workspace_id = default_workspace
    WHERE workspace_id IS NULL;
  END IF;
END $$;

-- 2) Propagar workspace_id para tabelas dependentes quando ainda nulo
UPDATE portal_dividas pd
SET workspace_id = pc.workspace_id
FROM portal_casos pc
WHERE pd.user_id = pc.user_id
  AND pd.workspace_id IS NULL
  AND pc.workspace_id IS NOT NULL;

UPDATE portal_documentos pdoc
SET workspace_id = pc.workspace_id
FROM portal_casos pc
WHERE pdoc.user_id = pc.user_id
  AND pdoc.workspace_id IS NULL
  AND pc.workspace_id IS NOT NULL;

-- 2.1) Backfill em registros operacionais legados sem workspace_id
DO $$
BEGIN
  IF to_regclass('public.portal_operational_records') IS NOT NULL THEN
    EXECUTE $sql$
      UPDATE portal_operational_records rec
      SET workspace_id = COALESCE(
        (
          SELECT pc.workspace_id
          FROM portal_casos pc
          WHERE pc.user_id::text = NULLIF(rec.record_data->>'user_id', '')
            AND pc.workspace_id IS NOT NULL
          LIMIT 1
        ),
        (
          SELECT pc.workspace_id
          FROM portal_casos pc
          WHERE pc.user_id::text = NULLIF(rec.record_data->>'cliente_user_id', '')
            AND pc.workspace_id IS NOT NULL
          LIMIT 1
        ),
        (
          SELECT pc.workspace_id
          FROM portal_casos pc
          WHERE pc.user_id::text = NULLIF(rec.record_data->>'cliente_id', '')
            AND pc.workspace_id IS NOT NULL
          LIMIT 1
        ),
        (
          SELECT id
          FROM portal_workspaces
          WHERE slug = 'hmadv-principal'
          LIMIT 1
        )
      )
      WHERE rec.workspace_id IS NULL
    $sql$;
  END IF;

  IF to_regclass('public.portal_operational_record_audit') IS NOT NULL
     AND to_regclass('public.portal_operational_records') IS NOT NULL THEN
    EXECUTE $sql$
      UPDATE portal_operational_record_audit audit
      SET workspace_id = rec.workspace_id
      FROM portal_operational_records rec
      WHERE audit.record_id = rec.id
        AND audit.workspace_id IS NULL
        AND rec.workspace_id IS NOT NULL
    $sql$;
  END IF;
END $$;

-- 3) Garantir membership basico para clientes com caso
INSERT INTO portal_workspace_members (workspace_id, user_id, role, is_active)
SELECT DISTINCT pc.workspace_id, pc.user_id, 'member', true
FROM portal_casos pc
WHERE pc.workspace_id IS NOT NULL
ON CONFLICT (workspace_id, user_id) DO UPDATE
SET is_active = true,
    role = CASE
      WHEN portal_workspace_members.role IN ('owner', 'admin', 'advogado', 'colaborador', 'financeiro', 'estagiario')
        THEN portal_workspace_members.role
      ELSE 'member'
    END;

-- 4) Workspace owner/admin pode gerenciar members (convites)
DROP POLICY IF EXISTS wsm_workspace_admin_manage ON portal_workspace_members;
CREATE POLICY wsm_workspace_admin_manage
  ON portal_workspace_members FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM portal_workspace_members pwm
      WHERE pwm.workspace_id = portal_workspace_members.workspace_id
        AND pwm.user_id = auth.uid()
        AND pwm.role IN ('owner', 'admin')
        AND pwm.is_active = true
    )
    OR is_master_admin()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM portal_workspace_members pwm
      WHERE pwm.workspace_id = portal_workspace_members.workspace_id
        AND pwm.user_id = auth.uid()
        AND pwm.role IN ('owner', 'admin')
        AND pwm.is_active = true
    )
    OR is_master_admin()
  );

-- 5) RPC de clientes com escopo coerente para shell admin
CREATE OR REPLACE FUNCTION admin_get_clients()
RETURNS TABLE(
  user_id         uuid,
  email           text,
  full_name       text,
  cpf             text,
  fase            text,
  onboarding_done boolean,
  cnj_step_atual  smallint,
  n_credores      integer,
  fd_ticket_id    bigint,
  workspace_id    uuid,
  workspace_slug  text,
  total_dividas   numeric,
  docs_aprovados  bigint,
  docs_pendentes  bigint,
  created_at      timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (
    is_master_admin()
    OR EXISTS (
      SELECT 1
      FROM portal_workspace_members pwm
      WHERE pwm.user_id = auth.uid()
        AND pwm.is_active = true
        AND pwm.role IN ('owner', 'admin', 'advogado', 'colaborador', 'financeiro')
    )
  ) THEN
    RAISE EXCEPTION 'Unauthorized: admin_get_clients requer perfil interno do workspace';
  END IF;

  RETURN QUERY
  SELECT
    pc.user_id,
    au.email::text,
    pc.full_name,
    pc.cpf,
    pc.fase,
    pc.onboarding_done,
    pc.cnj_step_atual,
    pc.n_credores,
    pc.fd_ticket_id,
    pc.workspace_id,
    pw.slug,
    COALESCE(dv.total_dividas, 0)::numeric,
    COALESCE(dc.aprovados, 0),
    COALESCE(dc.pendentes, 0),
    pc.created_at
  FROM portal_casos pc
  LEFT JOIN auth.users au ON au.id = pc.user_id
  LEFT JOIN portal_workspaces pw ON pw.id = pc.workspace_id
  LEFT JOIN LATERAL (
    SELECT SUM(pd.valor) AS total_dividas
    FROM portal_dividas pd
    WHERE pd.user_id = pc.user_id
  ) dv ON true
  LEFT JOIN LATERAL (
    SELECT
      COUNT(*) FILTER (WHERE pdoc.status = 'aprovado') AS aprovados,
      COUNT(*) FILTER (WHERE pdoc.status = 'pendente') AS pendentes
    FROM portal_documentos pdoc
    WHERE pdoc.user_id = pc.user_id
  ) dc ON true
  WHERE
    is_master_admin()
    OR (
      pc.workspace_id IS NOT NULL
      AND is_workspace_member_for(pc.workspace_id, ARRAY['owner', 'admin', 'advogado', 'colaborador', 'financeiro'])
    )
  ORDER BY pc.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION admin_get_clients() TO authenticated;
