import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), 'utf8');

describe('legal notifications contract', () => {
  it('reuses portal_cnj_notifications instead of creating a parallel legal_notifications table', () => {
    const migration = read('supabase', 'migrations-safe', '20260522_safe_019_legal_notifications.sql');

    expect(migration).toContain('ALTER TABLE portal_cnj_notifications');
    expect(migration).toContain('interaction_type');
    expect(migration).toContain('interaction_status');
    expect(migration).toContain('mark_portal_notification_read');
    expect(migration).toContain('portal_cnj_timeline');
    expect(migration).not.toContain('CREATE TABLE IF NOT EXISTS legal_notifications');
  });

  it('connects the drawer to Supabase-backed notification service with combined filters', () => {
    const service = read('services', 'legal-notifications.js');
    const app = read('js', 'app.js');

    expect(service).toContain("from('portal_cnj_notifications')");
    expect(service).toContain("supabase.rpc('mark_portal_notification_read'");
    expect(service).toContain('LEGAL_NOTIFICATION_TYPES');
    expect(service).toContain('LEGAL_NOTIFICATION_STATUSES');
    expect(app).toContain('toggleLegalNotificationFilter');
    expect(app).toContain('getFilteredLegalNotifications');
    expect(app).toContain('shellLegalNotificationFilters');
  });

  it('covers requested interaction types and statuses', () => {
    const service = read('services', 'legal-notifications.js');

    ['intimacao', 'solicitacao', 'orcamento', 'notificacao', 'assinatura'].forEach(type => {
      expect(service).toContain(type);
    });
    ['nao_lido', 'lido', 'assinado', 'pendente_assinatura', 'aprovado', 'pendente', 'recusado'].forEach(status => {
      expect(service).toContain(status);
    });
  });
});
