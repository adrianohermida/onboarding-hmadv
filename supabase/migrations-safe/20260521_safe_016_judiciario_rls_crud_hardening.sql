-- =============================================================================
-- MIGRATION 016 — RLS/CRUD hardening para schema judiciario
-- =============================================================================
-- Objetivo:
--   1) Habilitar RLS + FORCE RLS em 20 tabelas criticas do schema judiciario.
--   2) Garantir politicas CRUD explicitas (READ/CREATE/UPDATE/DELETE) para
--      usuarios autenticados com permissao administrativa (is_any_admin()).
--
-- Observacao:
--   Rotinas de workers utilizam service role e continuam operacionais.
-- =============================================================================

CREATE OR REPLACE FUNCTION can_access_judiciario_schema(
  p_roles text[] DEFAULT ARRAY['owner','admin','advogado','colaborador','financeiro']
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  legacy_admin boolean := false;
  profile_admin boolean := false;
  workspace_member boolean := false;
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

  IF to_regclass('public.portal_workspace_members') IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1
      FROM portal_workspace_members pwm
      WHERE pwm.user_id = auth.uid()
        AND pwm.is_active = true
        AND pwm.role = ANY(p_roles)
    ) INTO workspace_member;
  END IF;

  RETURN COALESCE(legacy_admin OR profile_admin OR workspace_member, false);
END;
$$;

DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'processos',
    'partes',
    'audiencias',
    'publicacoes',
    'movimentacoes',
    'movimentos',
    'monitoramento_queue',
    'processo_cobertura_sync',
    'processo_contato_sync',
    'processo_relacoes',
    'sync_divergencias',
    'financeiro_processual',
    'riscos_processuais',
    'prazo_calculado',
    'prazo_evento',
    'prazo_regra',
    'prazo_regra_alias',
    'prazo_tarefa',
    'operacao_jobs',
    'operacao_execucoes'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE judiciario.%I ENABLE ROW LEVEL SECURITY;', tbl);
    EXECUTE format('ALTER TABLE judiciario.%I FORCE ROW LEVEL SECURITY;', tbl);

    EXECUTE format('DROP POLICY IF EXISTS j_read_%I ON judiciario.%I;', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS j_create_%I ON judiciario.%I;', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS j_update_%I ON judiciario.%I;', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS j_delete_%I ON judiciario.%I;', tbl, tbl);

    EXECUTE format(
      'CREATE POLICY j_read_%I ON judiciario.%I FOR SELECT TO authenticated USING (can_access_judiciario_schema());',
      tbl,
      tbl
    );

    EXECUTE format(
      'CREATE POLICY j_create_%I ON judiciario.%I FOR INSERT TO authenticated WITH CHECK (can_access_judiciario_schema());',
      tbl,
      tbl
    );

    EXECUTE format(
      'CREATE POLICY j_update_%I ON judiciario.%I FOR UPDATE TO authenticated USING (can_access_judiciario_schema()) WITH CHECK (can_access_judiciario_schema());',
      tbl,
      tbl
    );

    EXECUTE format(
      'CREATE POLICY j_delete_%I ON judiciario.%I FOR DELETE TO authenticated USING (can_access_judiciario_schema());',
      tbl,
      tbl
    );
  END LOOP;
END $$;
