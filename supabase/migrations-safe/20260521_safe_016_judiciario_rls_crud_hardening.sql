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
      'CREATE POLICY j_read_%I ON judiciario.%I FOR SELECT TO authenticated USING (is_any_admin());',
      tbl,
      tbl
    );

    EXECUTE format(
      'CREATE POLICY j_create_%I ON judiciario.%I FOR INSERT TO authenticated WITH CHECK (is_any_admin());',
      tbl,
      tbl
    );

    EXECUTE format(
      'CREATE POLICY j_update_%I ON judiciario.%I FOR UPDATE TO authenticated USING (is_any_admin()) WITH CHECK (is_any_admin());',
      tbl,
      tbl
    );

    EXECUTE format(
      'CREATE POLICY j_delete_%I ON judiciario.%I FOR DELETE TO authenticated USING (is_any_admin());',
      tbl,
      tbl
    );
  END LOOP;
END $$;
