-- =============================================================================
-- MIGRATION 008 — Habilitação de RLS nas tabelas sem proteção
-- Portal: Hermida Maia Advocacia — Superendividamento CNJ
-- =============================================================================
-- ⚠️  ATENÇÃO: Habilitar RLS sem políticas bloqueia TUDO.
--    Esta migration adiciona as políticas ANTES de habilitar o RLS.
--    Cada tabela tem análise de impacto individual.
--
-- REGRAS ABSOLUTAS:
--   ✓ Cria política ANTES de habilitar RLS
--   ✓ Usa DO $$ BEGIN ... END $$ com IF NOT EXISTS para idempotência
--   ✓ service_role sempre contorna RLS (Supabase default)
--   ✓ Nunca bloqueia Edge Functions que usam service_role
-- =============================================================================
-- TABELAS SEM RLS (identificadas em audit):
--   contacts, groups, ticket_attachments, canned_responses, ticket_tasks,
--   lgpd_consents, crm_v12, re_company_users, re_agenda_slots,
--   re_bookings, re_credit_transactions
-- =============================================================================

-- ─── GRUPO 1: Freshdesk mirror tables ───────────────────────────────────────
-- contacts, groups, ticket_attachments, canned_responses, ticket_tasks
-- São espelhos do Freshdesk — leitura admin, escrita apenas via service_role.

-- contacts
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='contacts' AND policyname='admin_read_contacts') THEN
    CREATE POLICY admin_read_contacts ON contacts
      FOR SELECT TO authenticated USING (is_any_admin());
  END IF;
END $$;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- groups (freshdesk groups)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='groups' AND policyname='admin_read_groups') THEN
    CREATE POLICY admin_read_groups ON groups
      FOR SELECT TO authenticated USING (is_any_admin());
  END IF;
END $$;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- ticket_attachments
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='ticket_attachments' AND policyname='admin_read_ticket_attachments') THEN
    CREATE POLICY admin_read_ticket_attachments ON ticket_attachments
      FOR SELECT TO authenticated USING (is_any_admin());
  END IF;
END $$;
ALTER TABLE ticket_attachments ENABLE ROW LEVEL SECURITY;

-- canned_responses (respostas prontas — leitura por qualquer agente)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='canned_responses' AND policyname='authenticated_read_canned') THEN
    CREATE POLICY authenticated_read_canned ON canned_responses
      FOR SELECT TO authenticated USING (is_any_admin());
  END IF;
END $$;
ALTER TABLE canned_responses ENABLE ROW LEVEL SECURITY;

-- ticket_tasks
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='ticket_tasks' AND policyname='admin_read_ticket_tasks') THEN
    CREATE POLICY admin_read_ticket_tasks ON ticket_tasks
      FOR SELECT TO authenticated USING (is_any_admin());
  END IF;
END $$;
ALTER TABLE ticket_tasks ENABLE ROW LEVEL SECURITY;

-- ─── GRUPO 2: LGPD ──────────────────────────────────────────────────────────
-- lgpd_consents — usuário vê apenas os próprios consentimentos

DO $$ BEGIN
  -- Tentar coluna user_id, senão usar auth_id (dependendo do schema real)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lgpd_consents' AND column_name = 'user_id'
  ) THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='lgpd_consents' AND policyname='own_lgpd_consents') THEN
      EXECUTE $p$
        CREATE POLICY own_lgpd_consents ON lgpd_consents
          FOR SELECT TO authenticated
          USING (user_id::text = auth.uid()::text);
      $p$;
    END IF;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='lgpd_consents' AND policyname='admin_lgpd_all') THEN
    CREATE POLICY admin_lgpd_all ON lgpd_consents
      FOR ALL TO authenticated USING (is_any_admin());
  END IF;
END $$;
ALTER TABLE lgpd_consents ENABLE ROW LEVEL SECURITY;

-- ─── GRUPO 3: CRM legacy (crm_v12) ──────────────────────────────────────────
-- crm_v12 é tabela legada de CRM — acesso restrito ao admin

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='crm_v12' AND policyname='admin_crm_v12') THEN
    CREATE POLICY admin_crm_v12 ON crm_v12
      FOR ALL TO authenticated USING (is_any_admin());
  END IF;
END $$;
ALTER TABLE crm_v12 ENABLE ROW LEVEL SECURITY;

-- ─── GRUPO 4: re_* tables ────────────────────────────────────────────────────

-- re_company_users: membro vê o próprio registro, admin vê tudo
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='re_company_users' AND policyname='own_company_users') THEN
    EXECUTE $p$
      CREATE POLICY own_company_users ON re_company_users
        FOR SELECT TO authenticated
        USING (user_id = auth.uid() OR company_id IN (
          SELECT id FROM re_users WHERE auth_id = auth.uid()
        ));
    $p$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='re_company_users' AND policyname='admin_company_users') THEN
    CREATE POLICY admin_company_users ON re_company_users
      FOR ALL TO authenticated USING (is_any_admin());
  END IF;
END $$;
ALTER TABLE re_company_users ENABLE ROW LEVEL SECURITY;

-- re_agenda_slots: leitura pública (para exibir agenda), escrita admin
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='re_agenda_slots' AND policyname='public_read_slots') THEN
    CREATE POLICY public_read_slots ON re_agenda_slots
      FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='re_agenda_slots' AND policyname='admin_manage_slots') THEN
    CREATE POLICY admin_manage_slots ON re_agenda_slots
      FOR ALL TO authenticated USING (is_any_admin());
  END IF;
END $$;
ALTER TABLE re_agenda_slots ENABLE ROW LEVEL SECURITY;

-- re_bookings: usuário vê as próprias reservas; admin vê todas
DO $$ BEGIN
  -- Política de leitura própria (tenta user_id, depois re_user_id)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 're_bookings' AND column_name = 'user_id'
  ) THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='re_bookings' AND policyname='own_bookings') THEN
      EXECUTE $p$
        CREATE POLICY own_bookings ON re_bookings
          FOR SELECT TO authenticated USING (user_id = auth.uid());
      $p$;
    END IF;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='re_bookings' AND policyname='admin_all_bookings') THEN
    CREATE POLICY admin_all_bookings ON re_bookings
      FOR ALL TO authenticated USING (is_any_admin());
  END IF;
END $$;
ALTER TABLE re_bookings ENABLE ROW LEVEL SECURITY;

-- re_credit_transactions: usuário vê as próprias transações; admin vê todas
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 're_credit_transactions' AND column_name = 'user_id'
  ) THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='re_credit_transactions' AND policyname='own_credits') THEN
      EXECUTE $p$
        CREATE POLICY own_credits ON re_credit_transactions
          FOR SELECT TO authenticated USING (user_id = auth.uid());
      $p$;
    END IF;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='re_credit_transactions' AND policyname='admin_credits') THEN
    CREATE POLICY admin_credits ON re_credit_transactions
      FOR ALL TO authenticated USING (is_any_admin());
  END IF;
END $$;
ALTER TABLE re_credit_transactions ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- VERIFICAÇÃO PÓS-APLICAÇÃO:
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE tablename IN (
--   'contacts','groups','ticket_attachments','canned_responses','ticket_tasks',
--   'lgpd_consents','crm_v12','re_company_users','re_agenda_slots',
--   're_bookings','re_credit_transactions'
-- );
-- Esperado: rowsecurity = true para todas.
-- =============================================================================
-- REVERSÃO (por tabela):
-- ALTER TABLE contacts DISABLE ROW LEVEL SECURITY; DROP POLICY IF EXISTS admin_read_contacts ON contacts;
-- (repetir para cada tabela)
-- =============================================================================
