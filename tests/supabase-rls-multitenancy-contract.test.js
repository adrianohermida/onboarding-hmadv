import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();

function readFile(...parts) {
  return fs.readFileSync(path.join(root, ...parts), 'utf8');
}

describe('supabase rls multitenancy contract', () => {
  it('hardens master admin, workspace admin and operational records policies', () => {
    const migration = readFile('supabase', 'migrations-safe', '20260521_safe_015_rls_multitenancy_hardening.sql');

    [
      'CREATE OR REPLACE FUNCTION is_master_admin',
      'CREATE OR REPLACE FUNCTION is_workspace_member_for',
      'CREATE OR REPLACE FUNCTION current_workspace_id',
      'trg_set_operational_workspace_id',
      'DROP POLICY IF EXISTS admin_operational_records_all',
      'operational_records_master_all',
      'operational_records_workspace_select',
      'operational_records_workspace_insert',
      'operational_audit_workspace_select',
      'DROP POLICY IF EXISTS admin_all_casos',
      'DROP POLICY IF EXISTS admin_all_docs',
      'DROP POLICY IF EXISTS admin_all_dividas',
      'DROP POLICY IF EXISTS admin_all_timeline',
      'DROP POLICY IF EXISTS admin_all_notifications',
    ].forEach(token => {
      expect(migration).toContain(token);
    });
  });

  it('migration 019 upgrades core table policies to is_any_portal_admin for internal workspace staff', () => {
    const migration = readFile('supabase', 'migrations-safe', '20260522_safe_019_is_any_admin_upgrade.sql');

    expect(migration).toContain('CREATE OR REPLACE FUNCTION is_any_portal_admin()');
    expect(migration).toContain("pwm.role IN ('owner', 'admin', 'advogado', 'colaborador', 'financeiro', 'estagiario')");
    [
      'admin_workspaces_portal',
      'admin_workspace_members_portal',
      'admin_all_casos_portal',
      'admin_all_docs_portal',
      'admin_all_dividas_portal',
      'admin_all_timeline_portal',
      'admin_all_notifications_portal',
      'admin_operational_records_portal',
      'admin_operational_record_audit_portal',
      'doc_comments_select_portal',
      'doc_comments_insert_portal',
    ].forEach(policy => {
      expect(migration).toContain(policy);
    });
  });

  it('protects storage and client-side mutations with tenant/user filters', () => {
    const migration = readFile('supabase', 'migrations-safe', '20260521_safe_015_rls_multitenancy_hardening.sql');
    const database = readFile('services', 'database.js');
    const operational = readFile('modules', 'advogado', 'RegistroAdvogadoService.js');

    expect(migration).toContain('can_access_portal_document_path');
    expect(migration).toContain('portal_documentos_storage_select');
    expect(migration).toContain('portal_documentos_storage_insert');
    expect(migration).toContain("bucket_id = 'portal-documentos'");
    expect(database).toContain("supabase.rpc('is_any_admin')");
    expect(database).toContain(".eq('user_id', uid)");
    expect(operational).toContain("supabase.rpc('current_workspace_id')");
    expect(operational).toContain('remotePayload.workspace_id = workspaceId');
  });
});
