-- =============================================================================
-- MIGRATION 019 — Upgrade de is_any_admin() para autorização workspace-aware
-- Portal: Hermida Maia Advocacia — Superendividamento CNJ
-- =============================================================================
-- Objetivo:
--   1) Criar função is_any_portal_admin() que inclui is_any_admin() (admin_users)
--      OU membro interno ativo do workspace (owner/admin/advogado/colaborador/financeiro).
--   2) Recrear as policies críticas de tabelas core para usar is_any_portal_admin()
--      ao invés de is_any_admin(), garantindo que staff interno do workspace
--      consiga operar todos os módulos do shell admin.
--   3) Não remove is_any_admin() (continua necessária para RPCs de plataforma
--      e migrations anteriores que a referenciam).
-- =============================================================================

-- ─── Helper: is_any_portal_admin ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION is_any_portal_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  legacy_admin     boolean := false;
  profile_admin    boolean := false;
  workspace_member boolean := false;
BEGIN
  -- Legado: admin_users
  IF to_regclass('public.admin_users') IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    ) INTO legacy_admin;
  END IF;

  -- Perfil platform admin
  IF to_regclass('public.admin_profiles') IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1
      FROM admin_profiles
      WHERE id = auth.uid()
        AND is_active = true
        AND is_platform_admin = true
    ) INTO profile_admin;
  END IF;

  -- Membro interno ativo de qualquer workspace
  IF to_regclass('public.portal_workspace_members') IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1
      FROM portal_workspace_members pwm
      WHERE pwm.user_id = auth.uid()
        AND pwm.is_active = true
        AND pwm.role IN ('owner', 'admin', 'advogado', 'colaborador', 'financeiro', 'estagiario')
    ) INTO workspace_member;
  END IF;

  RETURN COALESCE(legacy_admin OR profile_admin OR workspace_member, false);
END;
$$;

-- ─── portal_workspaces ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS admin_workspaces ON portal_workspaces;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'portal_workspaces'
      AND policyname = 'admin_workspaces_portal'
  ) THEN
    CREATE POLICY admin_workspaces_portal ON portal_workspaces
      FOR ALL TO authenticated
      USING (is_any_portal_admin());
  END IF;
END $$;

-- ─── portal_workspace_members ────────────────────────────────────────────────
DROP POLICY IF EXISTS admin_workspace_members ON portal_workspace_members;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'portal_workspace_members'
      AND policyname = 'admin_workspace_members_portal'
  ) THEN
    CREATE POLICY admin_workspace_members_portal ON portal_workspace_members
      FOR SELECT TO authenticated
      USING (is_any_portal_admin() OR user_id = auth.uid());
  END IF;
END $$;

-- ─── portal_casos ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS admin_all_casos ON portal_casos;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'portal_casos'
      AND policyname = 'admin_all_casos_portal'
  ) THEN
    CREATE POLICY admin_all_casos_portal ON portal_casos
      FOR ALL TO authenticated
      USING (is_any_portal_admin());
  END IF;
END $$;

-- ─── portal_documentos ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS admin_all_docs ON portal_documentos;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'portal_documentos'
      AND policyname = 'admin_all_docs_portal'
  ) THEN
    CREATE POLICY admin_all_docs_portal ON portal_documentos
      FOR ALL TO authenticated
      USING (is_any_portal_admin());
  END IF;
END $$;

-- ─── portal_dividas ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS admin_all_dividas ON portal_dividas;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'portal_dividas'
      AND policyname = 'admin_all_dividas_portal'
  ) THEN
    CREATE POLICY admin_all_dividas_portal ON portal_dividas
      FOR ALL TO authenticated
      USING (is_any_portal_admin());
  END IF;
END $$;

-- ─── portal_cnj_timeline ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS admin_all_timeline ON portal_cnj_timeline;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'portal_cnj_timeline'
      AND policyname = 'admin_all_timeline_portal'
  ) THEN
    CREATE POLICY admin_all_timeline_portal ON portal_cnj_timeline
      FOR ALL TO authenticated
      USING (is_any_portal_admin());
  END IF;
END $$;

-- ─── portal_cnj_notifications ────────────────────────────────────────────────
DROP POLICY IF EXISTS admin_all_notifications ON portal_cnj_notifications;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'portal_cnj_notifications'
      AND policyname = 'admin_all_notifications_portal'
  ) THEN
    CREATE POLICY admin_all_notifications_portal ON portal_cnj_notifications
      FOR ALL TO authenticated
      USING (is_any_portal_admin());
  END IF;
END $$;

-- ─── portal_operational_records ──────────────────────────────────────────────
DO $$
BEGIN
  IF to_regclass('public.portal_operational_records') IS NOT NULL THEN
    EXECUTE $$
      DROP POLICY IF EXISTS admin_operational_records_all ON portal_operational_records;
    $$;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE tablename = 'portal_operational_records'
        AND policyname = 'admin_operational_records_portal'
    ) THEN
      EXECUTE $$
        CREATE POLICY admin_operational_records_portal ON portal_operational_records
          FOR ALL TO authenticated
          USING (is_any_portal_admin())
          WITH CHECK (is_any_portal_admin());
      $$;
    END IF;
  END IF;
END $$;

-- ─── portal_operational_record_audit ─────────────────────────────────────────
DO $$
BEGIN
  IF to_regclass('public.portal_operational_record_audit') IS NOT NULL THEN
    EXECUTE $$
      DROP POLICY IF EXISTS admin_operational_record_audit_all ON portal_operational_record_audit;
    $$;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE tablename = 'portal_operational_record_audit'
        AND policyname = 'admin_operational_record_audit_portal'
    ) THEN
      EXECUTE $$
        CREATE POLICY admin_operational_record_audit_portal ON portal_operational_record_audit
          FOR ALL TO authenticated
          USING (is_any_portal_admin())
          WITH CHECK (is_any_portal_admin());
      $$;
    END IF;
  END IF;
END $$;

-- ─── portal_document_comments ────────────────────────────────────────────────
DO $$
BEGIN
  IF to_regclass('public.portal_document_comments') IS NOT NULL THEN
    EXECUTE $$
      DROP POLICY IF EXISTS own_visible_document_comments ON portal_document_comments;
      DROP POLICY IF EXISTS insert_own_or_admin_document_comments ON portal_document_comments;
    $$;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE tablename = 'portal_document_comments'
        AND policyname = 'doc_comments_select_portal'
    ) THEN
      EXECUTE $$
        CREATE POLICY doc_comments_select_portal ON portal_document_comments
          FOR SELECT TO authenticated
          USING (
            is_any_portal_admin()
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
      $$;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE tablename = 'portal_document_comments'
        AND policyname = 'doc_comments_insert_portal'
    ) THEN
      EXECUTE $$
        CREATE POLICY doc_comments_insert_portal ON portal_document_comments
          FOR INSERT TO authenticated
          WITH CHECK (
            is_any_portal_admin()
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
      $$;
    END IF;
  END IF;
END $$;

-- ─── portal_partes_vinculos (migration 017) ──────────────────────────────────
DO $$
BEGIN
  IF to_regclass('public.portal_partes_vinculos') IS NOT NULL THEN
    EXECUTE $$
      DROP POLICY IF EXISTS admin_partes_vinculos ON portal_partes_vinculos;
    $$;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE tablename = 'portal_partes_vinculos'
        AND policyname = 'admin_partes_vinculos_portal'
    ) THEN
      EXECUTE $$
        CREATE POLICY admin_partes_vinculos_portal ON portal_partes_vinculos
          FOR ALL TO authenticated
          USING (is_any_portal_admin())
          WITH CHECK (is_any_portal_admin());
      $$;
    END IF;
  END IF;
END $$;

-- ─── portal_custas (migration 017) ───────────────────────────────────────────
DO $$
BEGIN
  IF to_regclass('public.portal_custas') IS NOT NULL THEN
    EXECUTE $$
      DROP POLICY IF EXISTS admin_portal_custas ON portal_custas;
    $$;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE tablename = 'portal_custas'
        AND policyname = 'admin_portal_custas_portal'
    ) THEN
      EXECUTE $$
        CREATE POLICY admin_portal_custas_portal ON portal_custas
          FOR ALL TO authenticated
          USING (is_any_portal_admin())
          WITH CHECK (is_any_portal_admin());
      $$;
    END IF;
  END IF;
END $$;

-- ─── portal_contratos (migration 017) ────────────────────────────────────────
DO $$
BEGIN
  IF to_regclass('public.portal_contratos') IS NOT NULL THEN
    EXECUTE $$
      DROP POLICY IF EXISTS admin_portal_contratos ON portal_contratos;
    $$;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE tablename = 'portal_contratos'
        AND policyname = 'admin_portal_contratos_portal'
    ) THEN
      EXECUTE $$
        CREATE POLICY admin_portal_contratos_portal ON portal_contratos
          FOR ALL TO authenticated
          USING (is_any_portal_admin())
          WITH CHECK (is_any_portal_admin());
      $$;
    END IF;
  END IF;
END $$;

-- ─── portal_planos_pagamento (migration 017) ─────────────────────────────────
DO $$
BEGIN
  IF to_regclass('public.portal_planos_pagamento') IS NOT NULL THEN
    EXECUTE $$
      DROP POLICY IF EXISTS admin_portal_planos_pagamento ON portal_planos_pagamento;
    $$;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE tablename = 'portal_planos_pagamento'
        AND policyname = 'admin_portal_planos_pagamento_portal'
    ) THEN
      EXECUTE $$
        CREATE POLICY admin_portal_planos_pagamento_portal ON portal_planos_pagamento
          FOR ALL TO authenticated
          USING (is_any_portal_admin())
          WITH CHECK (is_any_portal_admin());
      $$;
    END IF;
  END IF;
END $$;

-- =============================================================================
-- FIM DA MIGRATION 019
-- =============================================================================
