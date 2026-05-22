import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();

function readFile(...parts) {
  return fs.readFileSync(path.join(root, ...parts), 'utf8');
}

describe('clients visibility and invite contract', () => {
  it('tracks migration 018 safeguards for multitenant visibility and invite management', () => {
    const sql = readFile('supabase', 'migrations-safe', '20260522_safe_018_clients_visibility_invites.sql');

    [
      'CREATE OR REPLACE FUNCTION is_master_admin()',
      'CREATE OR REPLACE FUNCTION is_workspace_member_for(',
      'UPDATE portal_casos',
      'UPDATE portal_dividas pd',
      'UPDATE portal_documentos pdoc',
      'UPDATE portal_operational_records rec',
      'UPDATE portal_operational_record_audit audit',
      'INSERT INTO portal_workspace_members',
      'CREATE POLICY wsm_workspace_admin_manage',
      'CREATE OR REPLACE FUNCTION admin_get_clients()',
      "is_workspace_member_for(pc.workspace_id, ARRAY['owner', 'admin', 'advogado', 'colaborador', 'financeiro'])",
    ].forEach((token) => {
      expect(sql).toContain(token);
    });
  });

  it('exposes admin client invite action in data service and lawyer clients module UI', () => {
    const database = readFile('services', 'database.js');
    const advogadoPage = readFile('modules', 'advogado', 'PortalAdvogadoPage.js');

    expect(database).toContain('async sendClientInvite');
    expect(database).toContain("supabase.auth.signInWithOtp");
    expect(database).toContain('shouldCreateUser: true');
    expect(database).toContain('async ensureClientWorkspaceMember');
    expect(database).toContain('await AdminService.ensureClientWorkspaceMember');
    expect(database).toContain('const invitedBy = await getUserId().catch(() => null);');

    expect(advogadoPage).toContain('data-action="invite"');
    expect(advogadoPage).toContain('Convidar acesso');
    expect(advogadoPage).toContain('AdminService.sendClientInvite');
    expect(advogadoPage).toContain('userId: record.user_id || null');
    expect(advogadoPage).toContain('workspaceId: record.workspace_id || null');
  });
});
