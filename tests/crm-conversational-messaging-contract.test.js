import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();

function read(...parts) {
  return fs.readFileSync(path.join(root, ...parts), 'utf8');
}

describe('crm conversational messaging contract', () => {
  it('creates a real multi-tenant conversational model', () => {
    const sql = read('supabase', 'migrations-safe', '20260523_safe_023_crm_conversational_messaging.sql');

    [
      'CREATE TABLE IF NOT EXISTS crm_conversations',
      'CREATE TABLE IF NOT EXISTS crm_messages',
      'CREATE TABLE IF NOT EXISTS crm_participants',
      'CREATE TABLE IF NOT EXISTS crm_tickets',
      'CREATE TABLE IF NOT EXISTS crm_journeys',
      'CREATE TABLE IF NOT EXISTS crm_message_attachments',
      'CREATE TABLE IF NOT EXISTS crm_message_reads',
      'CREATE TABLE IF NOT EXISTS crm_conversation_typing',
      'CREATE TABLE IF NOT EXISTS crm_activity_logs',
      'CREATE OR REPLACE VIEW vw_crm_inbox',
    ].forEach(fragment => expect(sql).toContain(fragment));

    expect(sql).toContain('tenant_id uuid NOT NULL REFERENCES portal_workspaces');
    expect(sql).toContain('can_access_crm_conversation');
    expect(sql).toContain('is_workspace_member_for(tenant_id');
    expect(sql).toContain('search_vector tsvector GENERATED ALWAYS');
    expect(sql).toContain('CREATE OR REPLACE VIEW vw_crm_inbox WITH (security_invoker = true)');
    expect(sql).toContain('ALTER PUBLICATION supabase_realtime ADD TABLE crm_messages');
  });

  it('moves the Next inbox foundation to realtime subscriptions instead of polling', () => {
    const mensagens = read('apps', 'web', 'src', 'components', 'mensagens', 'MensagensClient.tsx');
    const atendimento = read('apps', 'web', 'src', 'components', 'atendimento', 'AtendimentoHub.tsx');
    const service = read('apps', 'web', 'src', 'features', 'conversational', 'ConversationalService.ts');
    const hook = read('apps', 'web', 'src', 'features', 'conversational', 'useRealtimeInbox.ts');

    expect(mensagens).not.toContain('refetchInterval');
    expect(atendimento).not.toContain('refetchInterval');
    expect(mensagens).toContain('useRealtimeInbox');
    expect(mensagens).toContain('useRealtimeConversation');
    expect(mensagens).not.toContain("from('re_messages')");
    expect(mensagens).not.toContain('buildConversas');
    expect(atendimento).toContain("channel(`atendimento-mensagens:");
    expect(atendimento).toContain("table: 're_mensagens'");
    expect(atendimento).toContain('ensurePortalConversation');
    expect(service).toContain("from('vw_crm_inbox')");
    expect(service).toContain("from('crm_messages')");
    expect(service).toContain("channel(`crm:conversation:");
    expect(hook).toContain('onMutate');
    expect(hook).toContain("delivery_status: 'sending'");
  });

  it('documents the audit and migration path from legacy feeds to juridical inbox', () => {
    const audit = read('docs', 'audits', '20260523-mensageria-atendimento.md');

    expect(audit).toContain('Conversas nao existiam como entidade persistida');
    expect(audit).toContain('RLS por `tenant_id`');
    expect(audit).toContain('`MensagensClient.tsx` passou a consumir `vw_crm_inbox`');
  });
});
