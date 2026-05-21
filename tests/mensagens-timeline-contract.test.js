import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  buildCommunicationSnapshot,
  buildCommunicationThreads,
  buildLegalTimeline,
  MESSAGE_EVENT_TYPES,
  normalizeCommunicationRecord,
} from '../modules/mensagens/CommunicationCenter.js';
import { ADVOGADO_MODULES } from '../modules/advogado/RegistroAdvogadoService.js';

const root = process.cwd();

function readFile(...parts) {
  return fs.readFileSync(path.join(root, ...parts), 'utf8');
}

describe('mensagens e timeline contract', () => {
  it('normalizes threads, comments, attachments and legal timeline events', () => {
    const records = [
      {
        id: 'm1',
        assunto: 'Documentos pendentes',
        cliente: 'Maria',
        thread_id: 'case-1',
        canal: 'portal',
        tipo_evento: 'comment.created',
        observacao: 'Cliente informou envio amanhã.',
        anexos: 'rg.pdf, comprovante.pdf',
        status: 'pendente',
      },
      {
        id: 'm2',
        assunto: 'Documentos pendentes',
        cliente: 'Maria',
        thread_id: 'case-1',
        canal: 'freshdesk',
        tipo_evento: 'attachment.added',
        observacao: 'Anexo recebido.',
        anexos: ['procuracao.pdf'],
        status: 'respondida',
      },
    ];

    const normalized = normalizeCommunicationRecord(records[0]);
    const threads = buildCommunicationThreads(records);
    const timeline = buildLegalTimeline({
      threads,
      onboarding: { onboarding_done: true, updated_at: '2026-05-21T10:00:00-04:00' },
      documents: [{ tipo: 'cpf', workflow_status: 'aprovado', updated_at: '2026-05-21T11:00:00-04:00' }],
      debts: [{ credor: 'Banco A', status: 'em_analise', updated_at: '2026-05-21T12:00:00-04:00' }],
    });
    const snapshot = buildCommunicationSnapshot(records, { onboarding: { onboarding_done: true } });

    expect(MESSAGE_EVENT_TYPES).toContain('client.history');
    expect(normalized.attachments).toHaveLength(2);
    expect(threads).toHaveLength(1);
    expect(threads[0].comments).toHaveLength(2);
    expect(threads[0].attachments).toHaveLength(3);
    expect(timeline.some(event => event.type === 'onboarding.updated')).toBe(true);
    expect(snapshot.openThreads).toBe(1);
    expect(snapshot.comments).toBe(2);
  });

  it('wires lawyer and client message experiences to communication center', () => {
    const config = ADVOGADO_MODULES.mensagens;
    const advogado = readFile('modules', 'advogado', 'PortalAdvogadoPage.js');
    const cliente = readFile('modules', 'cliente', 'PortalClientePage.js');
    const styles = readFile('styles', 'components.css');

    ['thread_id', 'tipo_evento', 'anexos', 'visivel_cliente'].forEach(field => {
      expect(config.fields.some(item => item.key === field)).toBe(true);
    });
    expect(advogado).toContain('renderCommunicationCenter');
    expect(advogado).toContain('data-comm-action="notify"');
    expect(advogado).toContain('buildCommunicationSnapshot');
    expect(cliente).toContain('buildCommunicationSnapshot');
    expect(cliente).toContain('cliente-case-history');
    expect(styles).toContain('.comm-center');
    expect(styles).toContain('.comm-thread-card');
    expect(styles).toContain('.cliente-case-history');
  });
});
