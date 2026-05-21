export const MESSAGE_CHANNELS = ['portal', 'email', 'telefone', 'whatsapp', 'freshdesk'];
export const MESSAGE_EVENT_TYPES = [
  'message.created',
  'comment.created',
  'attachment.added',
  'timeline.event',
  'onboarding.updated',
  'client.history',
];

function nowIso() {
  return new Date().toISOString();
}

function asArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : value.split(',').map(item => item.trim()).filter(Boolean);
    } catch (_) {
      return value.split(',').map(item => item.trim()).filter(Boolean);
    }
  }
  return [value];
}

function normalizeText(value, fallback = '') {
  return String(value ?? fallback).trim();
}

export function normalizeCommunicationRecord(record = {}) {
  const subject = normalizeText(record.assunto || record.titulo || record.thread, 'Atendimento jurídico');
  const client = normalizeText(record.cliente || record.nome || record.client, 'Cliente');
  const threadId = normalizeText(record.thread_id || record.threadId || `${client}:${subject}`).toLowerCase();
  const body = normalizeText(record.comentario || record.observacao || record.mensagem || record.body);

  return {
    id: record.id || `msg_${Date.now()}`,
    threadId,
    subject,
    client,
    channel: record.canal || 'portal',
    status: record.status || 'pendente',
    eventType: record.tipo_evento || record.eventType || (body ? 'comment.created' : 'message.created'),
    body,
    attachments: asArray(record.anexos || record.attachments),
    visibleToClient: record.visivel_cliente !== false && record.visivel_cliente !== 'false',
    authorRole: record.perfil_autor || record.authorRole || 'colaborador',
    createdAt: record.createdAt || record.created_at || record.updatedAt || nowIso(),
    updatedAt: record.updatedAt || record.updated_at || record.createdAt || nowIso(),
  };
}

export function buildCommunicationThreads(records = []) {
  const map = new Map();

  records.map(normalizeCommunicationRecord).forEach(item => {
    if (!map.has(item.threadId)) {
      map.set(item.threadId, {
        id: item.threadId,
        subject: item.subject,
        client: item.client,
        channel: item.channel,
        status: item.status,
        visibleToClient: item.visibleToClient,
        comments: [],
        attachments: [],
        events: [],
        updatedAt: item.updatedAt,
      });
    }
    const thread = map.get(item.threadId);
    thread.comments.push(item);
    thread.attachments.push(...item.attachments.map(label => ({ label, recordId: item.id })));
    thread.events.push({
      id: item.id,
      type: item.eventType,
      label: item.body || item.subject,
      createdAt: item.createdAt,
      visibleToClient: item.visibleToClient,
      channel: item.channel,
    });
    if (new Date(item.updatedAt) > new Date(thread.updatedAt)) thread.updatedAt = item.updatedAt;
    if (item.status === 'pendente') thread.status = 'pendente';
  });

  return [...map.values()].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

export function buildLegalTimeline({ threads = [], onboarding = {}, documents = [], debts = [] } = {}) {
  const events = [];

  threads.forEach(thread => {
    thread.events.forEach(event => {
      events.push({
        type: event.type,
        title: thread.subject,
        detail: event.label,
        createdAt: event.createdAt,
        source: event.channel || 'portal',
        visibleToClient: event.visibleToClient,
      });
    });
  });

  if (onboarding?.onboarding_done) {
    events.push({
      type: 'onboarding.updated',
      title: 'Onboarding concluído',
      detail: 'Formulário jurídico inicial finalizado.',
      createdAt: onboarding.updated_at || onboarding.created_at || nowIso(),
      source: 'onboarding',
      visibleToClient: true,
    });
  }

  documents.slice(0, 12).forEach(doc => {
    if (!doc.storage_path && !doc.workflow_status) return;
    events.push({
      type: 'document.updated',
      title: doc.nome_arquivo || doc.tipo || 'Documento',
      detail: doc.workflow_status || doc.status || 'documento atualizado',
      createdAt: doc.updated_at || doc.created_at || nowIso(),
      source: 'documentos',
      visibleToClient: true,
    });
  });

  debts.slice(0, 12).forEach(debt => {
    events.push({
      type: 'debt.updated',
      title: debt.credor || 'Dívida',
      detail: debt.situacao || debt.status || 'dívida registrada',
      createdAt: debt.updated_at || debt.created_at || nowIso(),
      source: 'dívidas',
      visibleToClient: true,
    });
  });

  return events.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 30);
}

export function buildCommunicationSnapshot(records = [], context = {}) {
  const threads = buildCommunicationThreads(records);
  const timeline = buildLegalTimeline({ threads, ...context });
  const openThreads = threads.filter(thread => !['respondida', 'arquivada'].includes(thread.status)).length;
  const comments = threads.reduce((sum, thread) => sum + thread.comments.length, 0);
  const attachments = threads.reduce((sum, thread) => sum + thread.attachments.length, 0);

  return {
    threads,
    timeline,
    openThreads,
    comments,
    attachments,
    visibleClientEvents: timeline.filter(event => event.visibleToClient).length,
  };
}
