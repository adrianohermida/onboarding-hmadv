import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const migrationPath = path.join(
  root,
  'supabase',
  'migrations-safe',
  '20260521_safe_016_judiciario_rls_crud_hardening.sql',
);

const TABLES = [
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
  'operacao_execucoes',
];

describe('judiciario rls crud contract', () => {
  it('tracks hardening migration with 20 critical judiciario tables', () => {
    const sql = fs.readFileSync(migrationPath, 'utf8');

    expect(TABLES).toHaveLength(20);
    TABLES.forEach((table) => {
      expect(sql).toContain(`'${table}'`);
    });
  });

  it('enforces full CRUD policy pattern for authenticated internal admins', () => {
    const sql = fs.readFileSync(migrationPath, 'utf8');

    expect(sql).toContain('ENABLE ROW LEVEL SECURITY');
    expect(sql).toContain('FORCE ROW LEVEL SECURITY');
    expect(sql).toContain('CREATE OR REPLACE FUNCTION can_access_judiciario_schema(');

    ['j_read_', 'j_create_', 'j_update_', 'j_delete_'].forEach((prefix) => {
      expect(sql).toContain(prefix);
    });

    expect(sql).toContain('FOR SELECT TO authenticated USING (can_access_judiciario_schema())');
    expect(sql).toContain('FOR INSERT TO authenticated WITH CHECK (can_access_judiciario_schema())');
    expect(sql).toContain('FOR UPDATE TO authenticated USING (can_access_judiciario_schema()) WITH CHECK (can_access_judiciario_schema())');
    expect(sql).toContain('FOR DELETE TO authenticated USING (can_access_judiciario_schema())');
  });
});
