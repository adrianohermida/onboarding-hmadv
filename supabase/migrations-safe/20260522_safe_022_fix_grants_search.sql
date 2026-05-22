-- ============================================================
-- Migration 022: Corrigir erros 020/021 + Busca Global + Índices FTS
-- Resolve: tabelas inexistentes causando falha nos GRANTs e realtime.
-- Adiciona: extensão pg_trgm, índices trigrama, RPC global_search.
-- ============================================================

-- ════════════════════════════════════════════════════════════
-- BLOCO 1: Corrigir GRANTs da migration 020
-- Problema: bare GRANT falha se tabela não existe (42P01)
-- Solução: DO $$ EXCEPTION WHEN undefined_table THEN NULL $$
-- ════════════════════════════════════════════════════════════

-- judiciario schema
DO $$ BEGIN GRANT USAGE ON SCHEMA judiciario TO authenticated;           EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN GRANT USAGE ON SCHEMA judiciario TO anon;                   EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN GRANT SELECT ON ALL TABLES IN SCHEMA judiciario TO authenticated; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN GRANT INSERT, UPDATE ON judiciario.processos           TO authenticated; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN GRANT INSERT, UPDATE ON judiciario.audiencias          TO authenticated; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN GRANT INSERT, UPDATE ON judiciario.prazo_calculado     TO authenticated; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN GRANT INSERT, UPDATE ON judiciario.publicacoes         TO authenticated; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN GRANT INSERT, UPDATE ON judiciario.financeiro_processual TO authenticated; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN GRANT INSERT, UPDATE ON judiciario.partes              TO authenticated; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN GRANT INSERT ON judiciario.tasks_freshsales            TO authenticated; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN GRANT USAGE ON ALL SEQUENCES IN SCHEMA judiciario TO authenticated;      EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- portal_* tables
DO $$ BEGIN GRANT SELECT, INSERT, UPDATE ON portal_casos              TO authenticated; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN GRANT SELECT, INSERT, UPDATE ON portal_documentos         TO authenticated; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN GRANT SELECT, INSERT, UPDATE ON portal_dividas            TO authenticated; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN GRANT SELECT, INSERT, UPDATE ON portal_custas             TO authenticated; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN GRANT SELECT, INSERT, UPDATE ON portal_contratos          TO authenticated; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN GRANT SELECT, INSERT, UPDATE ON portal_planos_pagamento   TO authenticated; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN GRANT SELECT, INSERT, UPDATE ON portal_document_requests  TO authenticated; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN GRANT SELECT, INSERT, UPDATE ON portal_document_comments  TO authenticated; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN GRANT SELECT, INSERT, UPDATE ON portal_partes_vinculos    TO authenticated; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN GRANT SELECT, INSERT, UPDATE ON portal_operational_records TO authenticated; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN GRANT SELECT, INSERT         ON portal_operational_record_audit TO authenticated; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN GRANT SELECT, INSERT         ON portal_cnj_timeline       TO authenticated; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN GRANT SELECT, UPDATE         ON portal_cnj_notifications  TO authenticated; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN GRANT SELECT, INSERT, UPDATE ON portal_workspaces         TO authenticated; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN GRANT SELECT, INSERT, UPDATE ON portal_workspace_members  TO authenticated; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN GRANT SELECT                 ON admin_users               TO authenticated; EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- re_* tables
DO $$ BEGIN GRANT SELECT, INSERT, UPDATE ON re_tarefas     TO authenticated; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN GRANT SELECT, INSERT, UPDATE ON re_mensagens   TO authenticated; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN GRANT SELECT, INSERT, UPDATE ON re_agendamentos TO authenticated; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN GRANT SELECT, UPDATE         ON re_agenda_slots TO authenticated; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN GRANT SELECT                 ON re_processos_judiciais TO authenticated; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN GRANT SELECT, INSERT, UPDATE ON onboarding_video_progress TO authenticated; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN GRANT SELECT                 ON onboarding_videos TO authenticated; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated; EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ════════════════════════════════════════════════════════════
-- BLOCO 2: Corrigir Realtime da migration 021
-- Problema: EXCEPTION WHEN duplicate_object não captura undefined_table
-- Solução: verificar IF EXISTS antes do ALTER PUBLICATION
-- ════════════════════════════════════════════════════════════

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='re_mensagens')  THEN ALTER PUBLICATION supabase_realtime ADD TABLE re_mensagens;  END IF; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='re_tarefas')    THEN ALTER PUBLICATION supabase_realtime ADD TABLE re_tarefas;    END IF; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='re_agendamentos') THEN ALTER PUBLICATION supabase_realtime ADD TABLE re_agendamentos; END IF; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='re_agenda_slots') THEN ALTER PUBLICATION supabase_realtime ADD TABLE re_agenda_slots; END IF; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='portal_casos')   THEN ALTER PUBLICATION supabase_realtime ADD TABLE portal_casos;   END IF; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='portal_documentos') THEN ALTER PUBLICATION supabase_realtime ADD TABLE portal_documentos; END IF; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='portal_custas')  THEN ALTER PUBLICATION supabase_realtime ADD TABLE portal_custas;  END IF; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='portal_contratos') THEN ALTER PUBLICATION supabase_realtime ADD TABLE portal_contratos; END IF; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='portal_planos_pagamento') THEN ALTER PUBLICATION supabase_realtime ADD TABLE portal_planos_pagamento; END IF; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='portal_cnj_notifications') THEN ALTER PUBLICATION supabase_realtime ADD TABLE portal_cnj_notifications; END IF; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='portal_cnj_timeline') THEN ALTER PUBLICATION supabase_realtime ADD TABLE portal_cnj_timeline; END IF; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='portal_partes_vinculos') THEN ALTER PUBLICATION supabase_realtime ADD TABLE portal_partes_vinculos; END IF; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='judiciario' AND tablename='publicacoes')    THEN ALTER PUBLICATION supabase_realtime ADD TABLE judiciario.publicacoes;    END IF; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='judiciario' AND tablename='processos')      THEN ALTER PUBLICATION supabase_realtime ADD TABLE judiciario.processos;      END IF; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='judiciario' AND tablename='audiencias')     THEN ALTER PUBLICATION supabase_realtime ADD TABLE judiciario.audiencias;     END IF; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='judiciario' AND tablename='prazo_calculado') THEN ALTER PUBLICATION supabase_realtime ADD TABLE judiciario.prazo_calculado; END IF; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ════════════════════════════════════════════════════════════
-- BLOCO 3: Extensão pg_trgm + Índices para busca com ILIKE
-- Permite ILIKE '%query%' em < 10ms mesmo com 10k+ registros
-- ════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Índices trigrama em publicacoes
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='judiciario' AND tablename='publicacoes') THEN
    CREATE INDEX IF NOT EXISTS idx_publicacoes_nome_cliente_trgm
      ON judiciario.publicacoes USING GIN (nome_cliente gin_trgm_ops);
    CREATE INDEX IF NOT EXISTS idx_publicacoes_numero_processo_trgm
      ON judiciario.publicacoes USING GIN (numero_processo_api gin_trgm_ops);
    CREATE INDEX IF NOT EXISTS idx_publicacoes_ai_resumo_trgm
      ON judiciario.publicacoes USING GIN (ai_resumo gin_trgm_ops);
    CREATE INDEX IF NOT EXISTS idx_publicacoes_data_pub
      ON judiciario.publicacoes (data_publicacao DESC);
    CREATE INDEX IF NOT EXISTS idx_publicacoes_lido_ativo
      ON judiciario.publicacoes (lido, ativo);
  END IF;
END $$;

-- Índices trigrama em processos
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='judiciario' AND tablename='processos') THEN
    CREATE INDEX IF NOT EXISTS idx_processos_numero_cnj_trgm
      ON judiciario.processos USING GIN (numero_cnj gin_trgm_ops);
    CREATE INDEX IF NOT EXISTS idx_processos_comarca_trgm
      ON judiciario.processos USING GIN (comarca gin_trgm_ops);
    CREATE INDEX IF NOT EXISTS idx_processos_tribunal_trgm
      ON judiciario.processos USING GIN (tribunal gin_trgm_ops);
    CREATE INDEX IF NOT EXISTS idx_processos_classe_trgm
      ON judiciario.processos USING GIN (classe gin_trgm_ops);
    CREATE INDEX IF NOT EXISTS idx_processos_status_prioridade
      ON judiciario.processos (status, prioridade);
    CREATE INDEX IF NOT EXISTS idx_processos_movimentacao
      ON judiciario.processos (data_ultima_movimentacao DESC);
  END IF;
END $$;

-- Índices trigrama em portal_casos
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='portal_casos') THEN
    CREATE INDEX IF NOT EXISTS idx_portal_casos_nome_cliente_trgm
      ON portal_casos USING GIN (nome_cliente gin_trgm_ops);
    CREATE INDEX IF NOT EXISTS idx_portal_casos_cpf_trgm
      ON portal_casos USING GIN (cpf gin_trgm_ops);
    CREATE INDEX IF NOT EXISTS idx_portal_casos_email
      ON portal_casos (email);
  END IF;
END $$;

-- Índice em re_tarefas
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='re_tarefas') THEN
    CREATE INDEX IF NOT EXISTS idx_re_tarefas_titulo_trgm
      ON re_tarefas USING GIN (titulo gin_trgm_ops);
    CREATE INDEX IF NOT EXISTS idx_re_tarefas_status
      ON re_tarefas (status);
  END IF;
END $$;

-- ════════════════════════════════════════════════════════════
-- BLOCO 4: RPC global_search
-- Busca cross-module em publicações, processos, clientes, tarefas.
-- SECURITY INVOKER: respeita RLS do usuário autenticado.
-- Usa nested BEGIN/EXCEPTION para suportar tabelas inexistentes.
-- ════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION global_search(
  p_query text,
  p_limit  int  DEFAULT 5
)
RETURNS TABLE (
  tipo     text,
  id       uuid,
  titulo   text,
  subtitulo text,
  href     text
)
SECURITY INVOKER
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  IF p_query IS NULL OR length(trim(p_query)) < 2 THEN
    RETURN;
  END IF;

  -- ── Publicações ───────────────────────────────────────────
  BEGIN
    RETURN QUERY
    SELECT
      'publicacao'::text                                                             AS tipo,
      p.id::uuid                                                                    AS id,
      coalesce(left(p.ai_resumo, 80), left(p.conteudo, 80), 'Publicação')::text   AS titulo,
      coalesce(p.nome_cliente, p.numero_processo_api, p.ai_tipo_ato, '')::text     AS subtitulo,
      '/publicacoes'::text                                                          AS href
    FROM judiciario.publicacoes p
    WHERE p.ativo = true
      AND (
           p.nome_cliente        ILIKE '%' || p_query || '%'
        OR p.numero_processo_api ILIKE '%' || p_query || '%'
        OR p.ai_resumo           ILIKE '%' || p_query || '%'
        OR p.conteudo            ILIKE '%' || p_query || '%'
      )
    ORDER BY p.data_publicacao DESC NULLS LAST
    LIMIT p_limit;
  EXCEPTION WHEN undefined_table OR undefined_column OR invalid_schema_name THEN
    NULL;
  END;

  -- ── Processos ─────────────────────────────────────────────
  BEGIN
    RETURN QUERY
    SELECT
      'processo'::text                                                              AS tipo,
      p.id::uuid                                                                   AS id,
      coalesce(p.numero_cnj, 'Processo')::text                                    AS titulo,
      coalesce(
        CASE WHEN p.tribunal IS NOT NULL AND p.comarca IS NOT NULL
             THEN p.tribunal || ' — ' || p.comarca
             ELSE coalesce(p.tribunal, p.comarca, p.classe, '')
        END, '')::text                                                              AS subtitulo,
      ('/processos/' || p.id::text)::text                                          AS href
    FROM judiciario.processos p
    WHERE
           p.numero_cnj    ILIKE '%' || p_query || '%'
        OR p.tribunal      ILIKE '%' || p_query || '%'
        OR p.comarca       ILIKE '%' || p_query || '%'
        OR p.classe        ILIKE '%' || p_query || '%'
        OR p.assunto       ILIKE '%' || p_query || '%'
        OR p.orgao_julgador ILIKE '%' || p_query || '%'
    ORDER BY p.data_ultima_movimentacao DESC NULLS LAST
    LIMIT p_limit;
  EXCEPTION WHEN undefined_table OR undefined_column OR invalid_schema_name THEN
    NULL;
  END;

  -- ── Clientes (portal_casos) ───────────────────────────────
  BEGIN
    RETURN QUERY
    SELECT
      'cliente'::text                                                               AS tipo,
      c.id::uuid                                                                   AS id,
      coalesce(c.nome_cliente, c.email, 'Cliente')::text                          AS titulo,
      coalesce(c.cpf, c.telefone, c.fase, '')::text                               AS subtitulo,
      ('/clientes/' || c.id::text)::text                                           AS href
    FROM portal_casos c
    WHERE
           c.nome_cliente ILIKE '%' || p_query || '%'
        OR c.cpf          ILIKE '%' || p_query || '%'
        OR c.email        ILIKE '%' || p_query || '%'
    ORDER BY c.created_at DESC NULLS LAST
    LIMIT p_limit;
  EXCEPTION WHEN undefined_table OR undefined_column THEN
    NULL;
  END;

  -- ── Tarefas ───────────────────────────────────────────────
  BEGIN
    RETURN QUERY
    SELECT
      'tarefa'::text                                                                AS tipo,
      t.id::uuid                                                                   AS id,
      t.titulo::text                                                               AS titulo,
      coalesce(t.status, '') || CASE WHEN t.prioridade IS NOT NULL
        THEN ' — ' || t.prioridade ELSE '' END                                     AS subtitulo,
      '/tarefas'::text                                                             AS href
    FROM re_tarefas t
    WHERE
           t.titulo    ILIKE '%' || p_query || '%'
        OR t.descricao ILIKE '%' || p_query || '%'
    ORDER BY t.criado_em DESC NULLS LAST
    LIMIT p_limit;
  EXCEPTION WHEN undefined_table OR undefined_column THEN
    NULL;
  END;

END;
$$;

-- Grant de execução para usuários autenticados
DO $$ BEGIN
  GRANT EXECUTE ON FUNCTION global_search(text, int) TO authenticated;
EXCEPTION WHEN OTHERS THEN NULL; END $$;
