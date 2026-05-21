const STORAGE_PREFIX = 'portal:advogado:registros:';
const TIMELINE_PREFIX = 'portal:advogado:timeline:';

export const ADVOGADO_MODULES = {
  clientes: {
    title: 'Clientes',
    singular: 'cliente',
    description: 'Carteira operacional do escritório, com leitura dos clientes reais quando disponível.',
    primaryField: 'nome',
    status: ['ativo', 'em_onboarding', 'pendente', 'arquivado'],
    fields: [
      { key: 'nome', label: 'Nome', type: 'text', required: true },
      { key: 'cpf', label: 'CPF', type: 'text' },
      { key: 'email', label: 'E-mail', type: 'email' },
      { key: 'fase', label: 'Fase', type: 'select', options: ['cadastro', 'documentos', 'negociação', 'processo', 'acompanhamento'] },
      { key: 'responsavel', label: 'Responsável', type: 'text' },
      { key: 'prazo', label: 'Prazo', type: 'date' },
    ],
  },
  planos: {
    title: 'Planos',
    singular: 'plano',
    description: 'Planos de pagamento, propostas e acordos vinculados aos casos.',
    primaryField: 'titulo',
    status: ['rascunho', 'em_revisao', 'enviado', 'aprovado', 'arquivado'],
    fields: [
      { key: 'titulo', label: 'Plano', type: 'text', required: true },
      { key: 'cliente', label: 'Cliente', type: 'text', required: true },
      { key: 'valor', label: 'Valor', type: 'number' },
      { key: 'prazo', label: 'Prazo', type: 'date' },
      { key: 'responsavel', label: 'Responsável', type: 'text' },
      { key: 'observacao', label: 'Observação', type: 'textarea' },
    ],
  },
  processos: {
    title: 'Processos',
    singular: 'processo',
    description: 'Acompanhamento processual jurídico por cliente, vara, prazo e responsável.',
    primaryField: 'numero',
    status: ['triagem', 'em_andamento', 'prazo_aberto', 'suspenso', 'arquivado'],
    fields: [
      { key: 'numero', label: 'Número do processo', type: 'text', required: true },
      { key: 'cliente', label: 'Cliente', type: 'text', required: true },
      { key: 'vara', label: 'Vara', type: 'text' },
      { key: 'prazo', label: 'Próximo prazo', type: 'date' },
      { key: 'responsavel', label: 'Responsável', type: 'text' },
      { key: 'observacao', label: 'Observação', type: 'textarea' },
    ],
  },
  tarefas: {
    title: 'Tarefas',
    singular: 'tarefa',
    description: 'Rotina interna com prioridades, responsáveis e prazos do caso.',
    primaryField: 'titulo',
    status: ['aberta', 'em_execucao', 'bloqueada', 'concluida', 'arquivada'],
    fields: [
      { key: 'titulo', label: 'Tarefa', type: 'text', required: true },
      { key: 'cliente', label: 'Cliente', type: 'text' },
      { key: 'prioridade', label: 'Prioridade', type: 'select', options: ['baixa', 'media', 'alta', 'critica'] },
      { key: 'prazo', label: 'Prazo', type: 'date' },
      { key: 'responsavel', label: 'Responsável', type: 'text' },
      { key: 'observacao', label: 'Observação', type: 'textarea' },
    ],
  },
  agenda: {
    title: 'Agenda',
    singular: 'compromisso',
    description: 'Audiências, reuniões, retornos e compromissos operacionais.',
    primaryField: 'titulo',
    status: ['agendado', 'confirmado', 'realizado', 'remarcar', 'arquivado'],
    fields: [
      { key: 'titulo', label: 'Compromisso', type: 'text', required: true },
      { key: 'cliente', label: 'Cliente', type: 'text' },
      { key: 'tipo', label: 'Tipo', type: 'select', options: ['reunião', 'audiência', 'retorno', 'prazo', 'interno'] },
      { key: 'data', label: 'Data', type: 'datetime-local' },
      { key: 'responsavel', label: 'Responsável', type: 'text' },
      { key: 'observacao', label: 'Observação', type: 'textarea' },
    ],
  },
  mensagens: {
    title: 'Mensagens',
    singular: 'mensagem',
    description: 'Comunicações com clientes, canais e tratativas registradas.',
    primaryField: 'assunto',
    status: ['rascunho', 'enviada', 'respondida', 'pendente', 'arquivada'],
    fields: [
      { key: 'assunto', label: 'Assunto', type: 'text', required: true },
      { key: 'cliente', label: 'Cliente', type: 'text' },
      { key: 'canal', label: 'Canal', type: 'select', options: ['portal', 'email', 'telefone', 'whatsapp', 'freshdesk'] },
      { key: 'prazo', label: 'Retorno até', type: 'date' },
      { key: 'responsavel', label: 'Responsável', type: 'text' },
      { key: 'observacao', label: 'Mensagem', type: 'textarea' },
    ],
  },
  financeiro: {
    title: 'Financeiro',
    singular: 'lançamento',
    description: 'Controle financeiro operacional do caso: honorários, custos e recebimentos.',
    primaryField: 'descricao',
    status: ['previsto', 'faturado', 'recebido', 'atrasado', 'arquivado'],
    fields: [
      { key: 'descricao', label: 'Descrição', type: 'text', required: true },
      { key: 'cliente', label: 'Cliente', type: 'text' },
      { key: 'valor', label: 'Valor', type: 'number' },
      { key: 'vencimento', label: 'Vencimento', type: 'date' },
      { key: 'responsavel', label: 'Responsável', type: 'text' },
      { key: 'observacao', label: 'Observação', type: 'textarea' },
    ],
  },
};

function storageKey(moduleKey) {
  return `${STORAGE_PREFIX}${moduleKey}`;
}

function timelineKey(moduleKey) {
  return `${TIMELINE_PREFIX}${moduleKey}`;
}

function parseJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (_) {
    return fallback;
  }
}

function persistJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function makeId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `rec_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function addTimelineEvent(moduleKey, recordId, type, detail) {
  const events = parseJson(timelineKey(moduleKey), []);
  const event = {
    id: makeId(),
    recordId,
    type,
    detail,
    createdAt: nowIso(),
  };
  events.unshift(event);
  persistJson(timelineKey(moduleKey), events.slice(0, 300));
  return event;
}

export function getAdvogadoModuleConfig(moduleKey) {
  return ADVOGADO_MODULES[moduleKey] || null;
}

export function listAdvogadoRecords(moduleKey) {
  return parseJson(storageKey(moduleKey), []);
}

export function saveAdvogadoRecord(moduleKey, payload, existingId = null) {
  const config = getAdvogadoModuleConfig(moduleKey);
  if (!config) throw new Error('Módulo não encontrado');

  const records = listAdvogadoRecords(moduleKey);
  const timestamp = nowIso();
  const normalized = {
    ...payload,
    status: payload.status || config.status[0],
    archived: payload.archived === true,
    source: 'local',
    updatedAt: timestamp,
  };

  if (existingId) {
    const index = records.findIndex(record => record.id === existingId);
    if (index < 0) throw new Error('Registro não encontrado');
    records[index] = { ...records[index], ...normalized };
    persistJson(storageKey(moduleKey), records);
    addTimelineEvent(moduleKey, existingId, 'updated', 'Registro atualizado');
    return records[index];
  }

  const record = {
    id: makeId(),
    createdAt: timestamp,
    ...normalized,
  };
  records.unshift(record);
  persistJson(storageKey(moduleKey), records);
  addTimelineEvent(moduleKey, record.id, 'created', 'Registro criado');
  return record;
}

export function archiveAdvogadoRecord(moduleKey, recordId) {
  const records = listAdvogadoRecords(moduleKey);
  const index = records.findIndex(record => record.id === recordId);
  if (index < 0) return null;
  records[index] = {
    ...records[index],
    archived: true,
    status: 'arquivado',
    updatedAt: nowIso(),
  };
  persistJson(storageKey(moduleKey), records);
  addTimelineEvent(moduleKey, recordId, 'archived', 'Registro arquivado');
  return records[index];
}

export function deleteAdvogadoRecord(moduleKey, recordId) {
  const records = listAdvogadoRecords(moduleKey);
  const next = records.filter(record => record.id !== recordId);
  persistJson(storageKey(moduleKey), next);
  addTimelineEvent(moduleKey, recordId, 'deleted', 'Registro excluído');
}

export function listAdvogadoTimeline(moduleKey, recordId = null) {
  const events = parseJson(timelineKey(moduleKey), []);
  return recordId ? events.filter(event => event.recordId === recordId) : events;
}

export function filterAdvogadoRecords(records, filters = {}) {
  const query = String(filters.query || '').trim().toLowerCase();
  const status = filters.status || 'todos';
  const archived = filters.archived === true;

  return records.filter(record => {
    if (Boolean(record.archived) !== archived) return false;
    if (status !== 'todos' && record.status !== status) return false;
    if (!query) return true;
    return Object.values(record).some(value => String(value ?? '').toLowerCase().includes(query));
  });
}

export function paginateAdvogadoRecords(records, page = 1, pageSize = 8) {
  const total = records.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), pages);
  const start = (safePage - 1) * pageSize;
  return {
    page: safePage,
    pageSize,
    total,
    pages,
    rows: records.slice(start, start + pageSize),
  };
}
