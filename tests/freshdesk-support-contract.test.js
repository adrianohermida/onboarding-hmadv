import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

describe('suporte Freshdesk multitenant', () => {
  it('evita CORS por apikey no proxy e centraliza lista/criacao na Edge Function', () => {
    const edge = read('services/edge.js');
    const service = read('services/freshdesk.js');

    expect(edge).toContain('includeApiKey = true');
    expect(service).toContain("action: 'list_tickets'");
    expect(service).toContain("action: 'get_contact'");
    expect(service).toContain("action: 'create_ticket'");
    expect(service).toContain('includeApiKey: false');
  });

  it('permite criar chamado com anexos e exibe lista mobile sincronizada', () => {
    const page = read('pages/suporte.html');
    const service = read('services/freshdesk.js');

    expect(page).toContain('id="t-attachments"');
    expect(page).toContain('multiple accept=');
    expect(page).toContain('data-label="Sincronizado"');
    expect(page).toContain('metadata?.attachments');
    expect(service).toContain('function fileToBase64');
    expect(service).toContain('normalizeAttachments');
  });

  it('backend aceita preflight com apikey e trata anexos sem expor Freshdesk no frontend', () => {
    const fn = read('supabase/functions/freshdesk-proxy/index.ts');

    expect(fn).toContain('"Access-Control-Allow-Headers"');
    expect(fn).toContain('apikey');
    expect(fn).toContain('action === "list_tickets"');
    expect(fn).toContain('action === "get_contact"');
    expect(fn).toContain('buildFreshdeskTicketBody');
    expect(fn).toContain('attachments[]');
    expect(fn).toContain('portal_caso_id.eq');
    expect(fn).toContain('admin.auth.getUser(token)');
  });

  it('remove declaracao duplicada que quebrava a jornada no shell ajax', () => {
    const journey = read('pages/onboarding-v2.html');
    const matches = journey.match(/let casoState/g) || [];

    expect(matches).toHaveLength(1);
  });
});
