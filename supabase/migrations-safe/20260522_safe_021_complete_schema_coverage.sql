-- ============================================================
-- Migration 021: Cobertura Completa de Todos os Schemas Supabase
-- Cobre: Storage (bucket mismatch), Realtime publication,
--        acesso cliente a re_ tables, views, RPCs, sequences.
-- Seguro para reaplicar (idempotente).
-- ============================================================

-- ════════════════════════════════════════════════════════════
-- BLOCO 1: STORAGE — Bucket 'documentos'
-- CRÍTICO: código usa supabase.storage.from('documentos')
-- mas migration 012 criou 'portal-documentos' → upload falha.
-- ════════════════════════════════════════════════════════════

-- Bucket principal usado pelo código atual
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documentos',
  'documentos',
  true,         -- público: código usa getPublicUrl(), não createSignedUrl()
  52428800,     -- 50 MB
  ARRAY[
    'application/pdf',
    'image/jpeg', 'image/png', 'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Bucket legado criado pela migration 012 (manter por retrocompatibilidade)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('portal-documentos', 'portal-documentos', true, 52428800)
ON CONFLICT (id) DO NOTHING;

-- ── Políticas para bucket 'documentos' ──────────────────────

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'documentos_admin_all'
  ) THEN
    CREATE POLICY documentos_admin_all ON storage.objects
      FOR ALL TO authenticated
      USING  (bucket_id = 'documentos' AND is_any_admin())
      WITH CHECK (bucket_id = 'documentos' AND is_any_admin());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'documentos_auth_insert'
  ) THEN
    CREATE POLICY documentos_auth_insert ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'documentos' AND auth.uid() IS NOT NULL);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'documentos_auth_select'
  ) THEN
    CREATE POLICY documentos_auth_select ON storage.objects
      FOR SELECT TO authenticated
      USING (bucket_id = 'documentos');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'documentos_auth_update'
  ) THEN
    CREATE POLICY documentos_auth_update ON storage.objects
      FOR UPDATE TO authenticated
      USING  (bucket_id = 'documentos' AND (is_any_admin() OR auth.uid() IS NOT NULL))
      WITH CHECK (bucket_id = 'documentos' AND (is_any_admin() OR auth.uid() IS NOT NULL));
  END IF;
END $$;

-- ── Políticas para bucket 'portal-documentos' ───────────────

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'portal_documentos_admin_all'
  ) THEN
    CREATE POLICY portal_documentos_admin_all ON storage.objects
      FOR ALL TO authenticated
      USING  (bucket_id = 'portal-documentos' AND is_any_admin())
      WITH CHECK (bucket_id = 'portal-documentos' AND is_any_admin());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'portal_documentos_auth_insert'
  ) THEN
    CREATE POLICY portal_documentos_auth_insert ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'portal-documentos' AND auth.uid() IS NOT NULL);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'portal_documentos_auth_select'
  ) THEN
    CREATE POLICY portal_documentos_auth_select ON storage.objects
      FOR SELECT TO authenticated
      USING (bucket_id = 'portal-documentos');
  END IF;
END $$;

-- ════════════════════════════════════════════════════════════
-- BLOCO 2: SUPABASE REALTIME — Adicionar tabelas à publication
-- Habilita subscriptions via .channel().on('postgres_changes',...)
-- Essencial para módulos de mensagens, notificações e updates live.
--
-- ATENÇÃO: para que subscriptions em schema 'judiciario' funcionem,
-- adicione 'judiciario' em: Dashboard → Settings → API → Exposed Schemas
-- ════════════════════════════════════════════════════════════

-- Schema public — módulos de conversas, tarefas, documentos
-- CORREÇÃO: EXCEPTION WHEN duplicate_object não captura 42P01 (undefined_table).
-- Solução: verificar IF EXISTS antes do ALTER PUBLICATION.
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='re_mensagens')          THEN ALTER PUBLICATION supabase_realtime ADD TABLE re_mensagens;           END IF; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='re_tarefas')            THEN ALTER PUBLICATION supabase_realtime ADD TABLE re_tarefas;             END IF; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='re_agendamentos')       THEN ALTER PUBLICATION supabase_realtime ADD TABLE re_agendamentos;         END IF; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='re_agenda_slots')       THEN ALTER PUBLICATION supabase_realtime ADD TABLE re_agenda_slots;         END IF; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='portal_casos')          THEN ALTER PUBLICATION supabase_realtime ADD TABLE portal_casos;            END IF; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='portal_documentos')     THEN ALTER PUBLICATION supabase_realtime ADD TABLE portal_documentos;       END IF; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='portal_custas')         THEN ALTER PUBLICATION supabase_realtime ADD TABLE portal_custas;           END IF; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='portal_contratos')      THEN ALTER PUBLICATION supabase_realtime ADD TABLE portal_contratos;        END IF; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='portal_planos_pagamento') THEN ALTER PUBLICATION supabase_realtime ADD TABLE portal_planos_pagamento; END IF; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='portal_cnj_notifications') THEN ALTER PUBLICATION supabase_realtime ADD TABLE portal_cnj_notifications; END IF; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='portal_cnj_timeline')   THEN ALTER PUBLICATION supabase_realtime ADD TABLE portal_cnj_timeline;    END IF; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='portal_partes_vinculos') THEN ALTER PUBLICATION supabase_realtime ADD TABLE portal_partes_vinculos; END IF; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Schema judiciário — publicações, processos, prazos
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='judiciario' AND tablename='publicacoes')    THEN ALTER PUBLICATION supabase_realtime ADD TABLE judiciario.publicacoes;    END IF; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='judiciario' AND tablename='processos')      THEN ALTER PUBLICATION supabase_realtime ADD TABLE judiciario.processos;      END IF; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='judiciario' AND tablename='audiencias')     THEN ALTER PUBLICATION supabase_realtime ADD TABLE judiciario.audiencias;     END IF; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='judiciario' AND tablename='prazo_calculado') THEN ALTER PUBLICATION supabase_realtime ADD TABLE judiciario.prazo_calculado; END IF; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ════════════════════════════════════════════════════════════
-- BLOCO 3: re_mensagens — Políticas de acesso cliente + admin
-- Admin (MensagensClient): lê e responde todas.
-- Cliente (AtendimentoHub): envia + lê suas próprias msgs.
-- ════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 're_mensagens') THEN

    -- Clientes: leitura de mensagens próprias ou do seu caso
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 're_mensagens' AND policyname = 'client_re_mensagens_select') THEN
      CREATE POLICY client_re_mensagens_select ON re_mensagens
        FOR SELECT TO authenticated
        USING (
          remetente_id = auth.uid()
          OR (
            caso_id IS NOT NULL
            AND caso_id IN (SELECT id FROM portal_casos WHERE user_id = auth.uid())
          )
        );
    END IF;

    -- Clientes: INSERT com remetente_id = próprio uid
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 're_mensagens' AND policyname = 'client_re_mensagens_insert') THEN
      CREATE POLICY client_re_mensagens_insert ON re_mensagens
        FOR INSERT TO authenticated
        WITH CHECK (remetente_id = auth.uid() OR is_any_admin());
    END IF;

    -- Clientes: UPDATE para marcar como lidas (lida = true)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 're_mensagens' AND policyname = 'client_re_mensagens_update') THEN
      CREATE POLICY client_re_mensagens_update ON re_mensagens
        FOR UPDATE TO authenticated
        USING (
          is_any_admin()
          OR remetente_id = auth.uid()
          OR (caso_id IS NOT NULL AND caso_id IN (SELECT id FROM portal_casos WHERE user_id = auth.uid()))
        );
    END IF;

    GRANT SELECT, INSERT, UPDATE ON re_mensagens TO authenticated;
  END IF;
END $$;

-- ════════════════════════════════════════════════════════════
-- BLOCO 4: re_agendamentos — Clientes criam e visualizam agendamentos
-- AtendimentoHub: INSERT com slot_id, email_cliente, tipo_atendimento
-- ════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 're_agendamentos') THEN

    -- Clientes: ver seus próprios agendamentos (por e-mail do auth user)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 're_agendamentos' AND policyname = 'client_re_agendamentos_select') THEN
      CREATE POLICY client_re_agendamentos_select ON re_agendamentos
        FOR SELECT TO authenticated
        USING (
          is_any_admin()
          OR email_cliente = (SELECT email FROM auth.users WHERE id = auth.uid())
        );
    END IF;

    -- Clientes: criar agendamento (qualquer autenticado pode solicitar)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 're_agendamentos' AND policyname = 'client_re_agendamentos_insert') THEN
      CREATE POLICY client_re_agendamentos_insert ON re_agendamentos
        FOR INSERT TO authenticated
        WITH CHECK (auth.uid() IS NOT NULL);
    END IF;

    GRANT SELECT, INSERT, UPDATE ON re_agendamentos TO authenticated;
  END IF;
END $$;

-- ════════════════════════════════════════════════════════════
-- BLOCO 5: re_agenda_slots — Clientes podem reservar slot (disponivel → false)
-- AtendimentoHub: UPDATE SET disponivel = false para marcar slot ocupado
-- ════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 're_agenda_slots') THEN

    -- Clientes: reservar slot disponível (SET disponivel = false)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 're_agenda_slots' AND policyname = 'client_re_agenda_slots_book') THEN
      CREATE POLICY client_re_agenda_slots_book ON re_agenda_slots
        FOR UPDATE TO authenticated
        USING  (disponivel = true)   -- só pode atualizar se ainda disponível
        WITH CHECK (disponivel = false); -- só pode marcar como indisponível
    END IF;

    GRANT SELECT, UPDATE ON re_agenda_slots TO authenticated;
  END IF;
END $$;

-- ════════════════════════════════════════════════════════════
-- BLOCO 6: re_tarefas — Admins criam com responsavel_id = auth.uid()
-- TarefasClient: INSERT com titulo, prioridade, responsavel_id = user.id
-- ════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 're_tarefas') THEN

    -- INSERT apenas para admins (ferramenta interna)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 're_tarefas' AND policyname = 'admin_re_tarefas_insert') THEN
      CREATE POLICY admin_re_tarefas_insert ON re_tarefas
        FOR INSERT TO authenticated
        WITH CHECK (is_any_admin() AND (responsavel_id = auth.uid() OR responsavel_id IS NULL));
    END IF;

    GRANT SELECT, INSERT, UPDATE ON re_tarefas TO authenticated;
  END IF;
END $$;

-- ════════════════════════════════════════════════════════════
-- BLOCO 7: re_processos_judiciais — Admin SELECT (dashboard, ClienteDetail)
-- ════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 're_processos_judiciais') THEN
    ALTER TABLE re_processos_judiciais ENABLE ROW LEVEL SECURITY;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 're_processos_judiciais' AND policyname = 'admin_re_processos_judiciais_all') THEN
      CREATE POLICY admin_re_processos_judiciais_all ON re_processos_judiciais
        FOR ALL TO authenticated
        USING (is_any_admin()) WITH CHECK (is_any_admin());
    END IF;

    GRANT SELECT ON re_processos_judiciais TO authenticated;
  END IF;
END $$;

-- ════════════════════════════════════════════════════════════
-- BLOCO 8: casos (tabela legacy — FK alvo de re_mensagens e re_tarefas)
-- O PostgREST resolve .select('casos(nome_cliente)') via FK.
-- Se existir tabela 'casos' separada de portal_casos, garantir acesso.
-- ════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'casos') THEN
    ALTER TABLE casos ENABLE ROW LEVEL SECURITY;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'casos' AND policyname = 'admin_casos_all') THEN
      CREATE POLICY admin_casos_all ON casos
        FOR ALL TO authenticated
        USING (is_any_admin()) WITH CHECK (is_any_admin());
    END IF;

    -- Clients: leitura do próprio caso (se coluna user_id existir)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'casos' AND column_name = 'user_id'
    ) THEN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'casos' AND policyname = 'own_casos_select') THEN
        CREATE POLICY own_casos_select ON casos
          FOR SELECT TO authenticated
          USING (user_id = auth.uid());
      END IF;
    END IF;

    GRANT SELECT ON casos TO authenticated;
  END IF;
END $$;

-- ════════════════════════════════════════════════════════════
-- BLOCO 9: portal_timeline (legacy alias de portal_cnj_timeline, se existir)
-- Usado em clientes/[id]/page.tsx via .from('portal_timeline')
-- ════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'portal_timeline') THEN
    ALTER TABLE portal_timeline ENABLE ROW LEVEL SECURITY;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'portal_timeline' AND policyname = 'admin_portal_timeline_all') THEN
      CREATE POLICY admin_portal_timeline_all ON portal_timeline
        FOR ALL TO authenticated
        USING (is_any_admin()) WITH CHECK (is_any_admin());
    END IF;

    -- Clientes: leitura de suas entradas de timeline (coluna user_id ou caso_id)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'portal_timeline' AND column_name = 'user_id'
    ) THEN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'portal_timeline' AND policyname = 'own_portal_timeline_select') THEN
        CREATE POLICY own_portal_timeline_select ON portal_timeline
          FOR SELECT TO authenticated
          USING (
            user_id = auth.uid()
            OR (
              caso_id IS NOT NULL
              AND caso_id IN (SELECT id FROM portal_casos WHERE user_id = auth.uid())
            )
          );
      END IF;
    END IF;

    GRANT SELECT, INSERT ON portal_timeline TO authenticated;
  END IF;
END $$;

-- ════════════════════════════════════════════════════════════
-- BLOCO 10: lgpd_consents — Usuários registram próprio consentimento
-- ════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'lgpd_consents') THEN
    ALTER TABLE lgpd_consents ENABLE ROW LEVEL SECURITY;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lgpd_consents' AND policyname = 'own_lgpd_consents') THEN
      CREATE POLICY own_lgpd_consents ON lgpd_consents
        FOR ALL TO authenticated
        USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lgpd_consents' AND policyname = 'admin_lgpd_consents_all') THEN
      CREATE POLICY admin_lgpd_consents_all ON lgpd_consents
        FOR ALL TO authenticated
        USING (is_any_admin());
    END IF;

    GRANT SELECT, INSERT, UPDATE ON lgpd_consents TO authenticated;
  END IF;
END $$;

-- ════════════════════════════════════════════════════════════
-- BLOCO 11: Tabelas de onboarding — acesso completo para próprio progresso
-- onboarding_videos: leitura pública (já ok)
-- onboarding_video_progress: usuário gerencia próprio progresso
-- ════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'onboarding_video_progress') THEN
    GRANT SELECT, INSERT, UPDATE ON onboarding_video_progress TO authenticated;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'onboarding_videos') THEN
    GRANT SELECT ON onboarding_videos TO authenticated;
  END IF;
END $$;

-- ════════════════════════════════════════════════════════════
-- BLOCO 12: Freshdesk tables — SELECT para admins e clientes
-- ════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'freshdesk_tickets') THEN
    GRANT SELECT ON freshdesk_tickets TO authenticated;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'freshdesk_contacts') THEN
    GRANT SELECT ON freshdesk_contacts TO authenticated;
  END IF;
END $$;

-- ════════════════════════════════════════════════════════════
-- BLOCO 13: Views — garantir GRANT SELECT em todas as views
-- ════════════════════════════════════════════════════════════

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_views WHERE schemaname='public' AND viewname='vw_superendividamento_cliente') THEN
    GRANT SELECT ON vw_superendividamento_cliente TO authenticated;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_views WHERE schemaname='public' AND viewname='vw_cnj_dashboard_admin') THEN
    GRANT SELECT ON vw_cnj_dashboard_admin TO authenticated;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_views WHERE schemaname='public' AND viewname='vw_cnj_mapa_credores_analise') THEN
    GRANT SELECT ON vw_cnj_mapa_credores_analise TO authenticated;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_views WHERE schemaname='public' AND viewname='vw_freshdesk_portal_sync') THEN
    GRANT SELECT ON vw_freshdesk_portal_sync TO authenticated;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_views WHERE schemaname='public' AND viewname='vw_admin_global') THEN
    GRANT SELECT ON vw_admin_global TO authenticated;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_views WHERE schemaname='public' AND viewname='vw_admin_casos_detalhado') THEN
    GRANT SELECT ON vw_admin_casos_detalhado TO authenticated;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_views WHERE schemaname='public' AND viewname='vw_admin_download_audit') THEN
    GRANT SELECT ON vw_admin_download_audit TO authenticated;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_views WHERE schemaname='public' AND viewname='vw_portal_cnj_form_status') THEN
    GRANT SELECT ON vw_portal_cnj_form_status TO authenticated;
  END IF;
END $$;

-- ════════════════════════════════════════════════════════════
-- BLOCO 14: RPCs — garantir GRANT EXECUTE
-- Usa EXCEPTION para não falhar se função não existir no banco.
-- ════════════════════════════════════════════════════════════

DO $$ BEGIN GRANT EXECUTE ON FUNCTION rpc_get_meu_caso()                        TO authenticated; EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN GRANT EXECUTE ON FUNCTION admin_get_clients()                        TO authenticated; EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN GRANT EXECUTE ON FUNCTION admin_get_stats()                          TO authenticated; EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN GRANT EXECUTE ON FUNCTION mark_portal_notification_read(uuid)        TO authenticated; EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN GRANT EXECUTE ON FUNCTION admin_update_doc_workflow(uuid, text, text) TO authenticated; EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN GRANT EXECUTE ON FUNCTION is_any_admin()                             TO authenticated; EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN GRANT EXECUTE ON FUNCTION is_master_admin()                          TO authenticated; EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN GRANT EXECUTE ON FUNCTION can_access_judiciario_schema(text[])       TO authenticated; EXCEPTION WHEN undefined_function THEN NULL; END $$;
DO $$ BEGIN GRANT EXECUTE ON FUNCTION current_workspace_id()                     TO authenticated; EXCEPTION WHEN undefined_function THEN NULL; END $$;

-- ════════════════════════════════════════════════════════════
-- BLOCO 15: Sequences finais — garantir que INSERT funciona
-- em todas as tabelas com PKs auto-geradas (serial/bigserial)
-- ════════════════════════════════════════════════════════════

DO $$ BEGIN GRANT USAGE ON ALL SEQUENCES IN SCHEMA public      TO authenticated; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN GRANT USAGE ON ALL SEQUENCES IN SCHEMA judiciario  TO authenticated; EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Herdar em novos objetos criados futuramente
DO $$ BEGIN
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE ON SEQUENCES TO authenticated;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ════════════════════════════════════════════════════════════
-- BLOCO 16: anon role — grants mínimos para rotas públicas
-- (login, callback, convite — não requerem autenticação)
-- ════════════════════════════════════════════════════════════

GRANT USAGE ON SCHEMA public      TO anon;
GRANT USAGE ON SCHEMA judiciario  TO anon;

-- Anon pode ler slots de agenda (para exibir horários disponíveis pré-login)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 're_agenda_slots') THEN
    GRANT SELECT ON re_agenda_slots TO anon;
  END IF;
END $$;

-- ════════════════════════════════════════════════════════════
-- NOTA MANUAL OBRIGATÓRIA — PostgREST (não configurável via SQL)
--
-- Para que supabase.schema('judiciario') e subscriptions realtime
-- no schema judiciário funcionem via REST API:
--
--   1. Dashboard → Settings → API → Exposed Schemas
--      Adicionar: judiciario
--
--   2. Dashboard → Settings → API → Extra Search Path
--      Adicionar: extensions
--
-- Sem isso, supabase.schema('judiciario') retorna 404.
-- Esta migration cobre apenas a camada SQL (GRANTs + RLS).
-- ════════════════════════════════════════════════════════════
