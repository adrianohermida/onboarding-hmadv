-- ============================================================
-- Migration 020: Full CRUD Access Hardening — All Modules
-- Garante que todos os módulos consigam fazer SELECT/INSERT/UPDATE
-- no Supabase conectado. Seguro para reaplicar (idempotente).
-- ============================================================

-- ════════════════════════════════════════════════════════════
-- BLOCO 1: SCHEMA JUDICIÁRIO — GRANTS CRÍTICOS FALTANDO
-- Sem GRANT USAGE ON SCHEMA, todo acesso via REST falha antes
-- mesmo de chegar nas políticas RLS.
-- ════════════════════════════════════════════════════════════

GRANT USAGE ON SCHEMA judiciario TO anon;
GRANT USAGE ON SCHEMA judiciario TO authenticated;

-- Leitura em todas as tabelas do schema judiciário
GRANT SELECT ON ALL TABLES IN SCHEMA judiciario TO authenticated;

-- Escrita nas tabelas que possuem mutações nos hooks
GRANT INSERT, UPDATE ON
  judiciario.processos,
  judiciario.audiencias,
  judiciario.prazo_calculado,
  judiciario.publicacoes,
  judiciario.financeiro_processual,
  judiciario.partes
TO authenticated;

-- tasks_freshsales: INSERT de tarefas locais (se existir)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'judiciario' AND tablename = 'tasks_freshsales'
  ) THEN
    GRANT INSERT ON judiciario.tasks_freshsales TO authenticated;
  END IF;
END $$;

-- Sequences: necessário para PKs geradas automaticamente em INSERT
GRANT USAGE ON ALL SEQUENCES IN SCHEMA judiciario TO authenticated;

-- Novos objetos criados futuramente herdam o mesmo acesso
ALTER DEFAULT PRIVILEGES IN SCHEMA judiciario
  GRANT SELECT ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA judiciario
  GRANT USAGE ON SEQUENCES TO authenticated;

-- ════════════════════════════════════════════════════════════
-- BLOCO 2: re_tarefas — RLS + políticas + grants
-- Usado em sidebar-counts, use-processos (por processo_id)
-- Acesso apenas para staff interno (is_any_admin)
-- ════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 're_tarefas'
  ) THEN
    ALTER TABLE re_tarefas ENABLE ROW LEVEL SECURITY;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE tablename = 're_tarefas' AND policyname = 'admin_re_tarefas_all'
    ) THEN
      CREATE POLICY admin_re_tarefas_all ON re_tarefas
        FOR ALL TO authenticated
        USING (is_any_admin())
        WITH CHECK (is_any_admin());
    END IF;

    GRANT SELECT, INSERT, UPDATE ON re_tarefas TO authenticated;
  END IF;
END $$;

-- ════════════════════════════════════════════════════════════
-- BLOCO 3: re_mensagens — RLS + políticas + grants
-- sidebar-counts conta mensagens não lidas (todos os usuários)
-- ════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 're_mensagens'
  ) THEN
    ALTER TABLE re_mensagens ENABLE ROW LEVEL SECURITY;

    -- Staff: acesso total
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE tablename = 're_mensagens' AND policyname = 'admin_re_mensagens_all'
    ) THEN
      CREATE POLICY admin_re_mensagens_all ON re_mensagens
        FOR ALL TO authenticated
        USING (is_any_admin())
        WITH CHECK (is_any_admin());
    END IF;

    -- Clientes: leitura das próprias mensagens (se coluna user_id existir)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 're_mensagens'
        AND column_name = 'user_id'
    ) THEN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 're_mensagens' AND policyname = 'own_re_mensagens_read'
      ) THEN
        CREATE POLICY own_re_mensagens_read ON re_mensagens
          FOR SELECT TO authenticated
          USING (user_id = auth.uid());
      END IF;
    END IF;

    GRANT SELECT, INSERT, UPDATE ON re_mensagens TO authenticated;
  END IF;
END $$;

-- ════════════════════════════════════════════════════════════
-- BLOCO 4: re_agendamentos — RLS + políticas + grants
-- Módulo agenda: criação e listagem de agendamentos
-- ════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 're_agendamentos'
  ) THEN
    ALTER TABLE re_agendamentos ENABLE ROW LEVEL SECURITY;

    -- Staff: acesso total
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE tablename = 're_agendamentos' AND policyname = 'admin_re_agendamentos_all'
    ) THEN
      CREATE POLICY admin_re_agendamentos_all ON re_agendamentos
        FOR ALL TO authenticated
        USING (is_any_admin())
        WITH CHECK (is_any_admin());
    END IF;

    -- Clientes: leitura dos próprios agendamentos (se coluna user_id existir)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 're_agendamentos'
        AND column_name = 'user_id'
    ) THEN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 're_agendamentos' AND policyname = 'own_re_agendamentos_read'
      ) THEN
        CREATE POLICY own_re_agendamentos_read ON re_agendamentos
          FOR SELECT TO authenticated
          USING (user_id = auth.uid());
      END IF;
    END IF;

    GRANT SELECT, INSERT, UPDATE ON re_agendamentos TO authenticated;
  END IF;
END $$;

-- ════════════════════════════════════════════════════════════
-- BLOCO 5: re_agenda_slots — Política de escrita para admin
-- Migration 008 já habilitou RLS + leitura pública.
-- Faltava política de escrita para admins.
-- ════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 're_agenda_slots'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE tablename = 're_agenda_slots' AND policyname = 'admin_re_agenda_slots_all'
    ) THEN
      CREATE POLICY admin_re_agenda_slots_all ON re_agenda_slots
        FOR ALL TO authenticated
        USING (is_any_admin())
        WITH CHECK (is_any_admin());
    END IF;

    GRANT SELECT, INSERT, UPDATE ON re_agenda_slots TO authenticated;
  END IF;
END $$;

-- ════════════════════════════════════════════════════════════
-- BLOCO 6: admin_users — Admins podem ler todos os registros
-- A política admin_read_self só permite self-read.
-- Adiciona leitura completa para admins (gestão de usuários).
-- ════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'admin_users' AND policyname = 'admin_read_all_admin_users'
  ) THEN
    CREATE POLICY admin_read_all_admin_users ON admin_users
      FOR SELECT TO authenticated
      USING (is_any_admin());
  END IF;
END $$;

GRANT SELECT ON admin_users TO authenticated;

-- ════════════════════════════════════════════════════════════
-- BLOCO 7: Tabelas PUBLIC — Garantir grants completos
-- Idempotente: GRANT não falha se já existir.
-- ════════════════════════════════════════════════════════════

-- Tabelas core do portal
GRANT SELECT, INSERT, UPDATE ON portal_casos               TO authenticated;
GRANT SELECT, INSERT, UPDATE ON portal_documentos          TO authenticated;
GRANT SELECT, INSERT, UPDATE ON portal_dividas             TO authenticated;

-- Módulos do cliente (Financeiro, Custas, Contratos)
GRANT SELECT, INSERT, UPDATE ON portal_custas              TO authenticated;
GRANT SELECT, INSERT, UPDATE ON portal_contratos           TO authenticated;
GRANT SELECT, INSERT, UPDATE ON portal_planos_pagamento    TO authenticated;

-- Workflow de documentos
GRANT SELECT, INSERT, UPDATE ON portal_document_requests   TO authenticated;
GRANT SELECT, INSERT, UPDATE ON portal_document_comments   TO authenticated;

-- Partes vinculadas e registros operacionais
GRANT SELECT, INSERT, UPDATE ON portal_partes_vinculos     TO authenticated;
GRANT SELECT, INSERT, UPDATE ON portal_operational_records TO authenticated;
GRANT SELECT, INSERT         ON portal_operational_record_audit TO authenticated;

-- Notificações e timeline
GRANT SELECT, INSERT         ON portal_cnj_timeline        TO authenticated;
GRANT SELECT, UPDATE         ON portal_cnj_notifications   TO authenticated;

-- Workspaces e membros
GRANT SELECT, INSERT, UPDATE ON portal_workspaces          TO authenticated;
GRANT SELECT, INSERT, UPDATE ON portal_workspace_members   TO authenticated;

-- Onboarding e auditoria de download (SELECT já concedido)
GRANT SELECT ON onboarding_videos           TO authenticated;
GRANT SELECT, INSERT, UPDATE ON onboarding_video_progress TO authenticated;
GRANT SELECT ON portal_download_audit       TO authenticated;

-- Sequences: INSERT com PKs auto-geradas no schema public
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ════════════════════════════════════════════════════════════
-- BLOCO 8: Verificar RLS habilitado em tabelas críticas
-- ALTER TABLE ... ENABLE ROW LEVEL SECURITY é idempotente.
-- ════════════════════════════════════════════════════════════

ALTER TABLE IF EXISTS portal_casos               ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS portal_documentos          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS portal_dividas             ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS portal_custas              ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS portal_contratos           ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS portal_planos_pagamento    ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS portal_partes_vinculos     ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS portal_document_requests   ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS portal_document_comments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS portal_operational_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS admin_users                ENABLE ROW LEVEL SECURITY;

-- ════════════════════════════════════════════════════════════
-- NOTA IMPORTANTE — Configuração PostgREST (não-SQL):
-- Para que `supabase.schema('judiciario')` funcione via REST API,
-- o schema 'judiciario' deve estar listado em:
--   Dashboard → Settings → API → Exposed Schemas
-- Adicionar 'judiciario' se não estiver lá.
-- Esta migration cobre apenas os GRANTs SQL.
-- ════════════════════════════════════════════════════════════
