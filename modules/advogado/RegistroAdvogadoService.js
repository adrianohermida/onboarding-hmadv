const STORAGE_PREFIX = 'portal:advogado:registros:';
const TIMELINE_PREFIX = 'portal:advogado:timeline:';
const AUDIT_PREFIX = 'portal:advogado:audit:';
const OPERATIONAL_TABLE = 'portal_operational_records';
const AUDIT_TABLE = 'portal_operational_record_audit';

let supabaseClientPromise = null;
let currentWorkspacePromise = null;

async function getSupabaseClient() {
  if (!supabaseClientPromise) {
    supabaseClientPromise = import('../../services/supabase.js').then(module => module.supabase);
  }
  return supabaseClientPromise;
}

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
      { key: 'parcela_sugerida', label: 'Parcela sugerida', type: 'number' },
      { key: 'prazo_meses', label: 'Prazo em meses', type: 'number' },
      { key: 'prazo', label: 'Prazo', type: 'date' },
      { key: 'responsavel', label: 'Responsável', type: 'text' },
      { key: 'observacao', label: 'Observação', type: 'textarea' },
    ],
  },
  documentos: {
    title: 'Documentos',
    singular: 'documento',
    description: 'Controle operacional de documentos enviados, revisados e assinados.',
    primaryField: 'titulo',
    status: ['pendente_envio', 'em_analise', 'aprovado', 'aguardando_assinatura', 'arquivado'],
    fields: [
      { key: 'titulo', label: 'Documento', type: 'text', required: true },
      { key: 'cliente', label: 'Cliente', type: 'text', required: true },
      { key: 'categoria', label: 'Categoria', type: 'select', options: ['identidade', 'residência', 'financeiro', 'dívidas', 'contratos', 'assinatura'] },
      { key: 'prazo', label: 'Prazo', type: 'date' },
      { key: 'responsavel', label: 'Responsável', type: 'text' },
      { key: 'observacao', label: 'Observação', type: 'textarea' },
    ],
  },
  dividas: {
    title: 'Dívidas',
    singular: 'dívida',
    description: 'Controle operacional de credores, valores, status e tratativas.',
    primaryField: 'credor',
    status: ['informada', 'em_analise', 'negociacao', 'contestada', 'arquivada'],
    fields: [
      { key: 'credor', label: 'Credor', type: 'text', required: true },
      { key: 'cliente', label: 'Cliente', type: 'text', required: true },
      { key: 'valor', label: 'Valor', type: 'number' },
      { key: 'tipo', label: 'Tipo', type: 'select', options: ['cartão', 'empréstimo', 'cheque especial', 'financiamento', 'outros'] },
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
      { key: 'sla_horas', label: 'SLA em horas', type: 'number' },
      { key: 'perfil_responsavel', label: 'Perfil responsável', type: 'select', options: ['advogado', 'colaborador', 'financeiro', 'administrador'] },
      { key: 'responsavel', label: 'Responsável', type: 'text' },
      { key: 'lembrete_em', label: 'Lembrete', type: 'datetime-local' },
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
      { key: 'sla_horas', label: 'SLA em horas', type: 'number' },
      { key: 'perfil_responsavel', label: 'Perfil responsável', type: 'select', options: ['advogado', 'colaborador', 'financeiro', 'administrador'] },
      { key: 'responsavel', label: 'Responsável', type: 'text' },
      { key: 'lembrete_em', label: 'Lembrete', type: 'datetime-local' },
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
      { key: 'thread_id', label: 'Thread', type: 'text' },
      { key: 'canal', label: 'Canal', type: 'select', options: ['portal', 'email', 'telefone', 'whatsapp', 'freshdesk'] },
      { key: 'tipo_evento', label: 'Evento', type: 'select', options: ['message.created', 'comment.created', 'attachment.added', 'timeline.event', 'onboarding.updated', 'client.history'] },
      { key: 'prazo', label: 'Retorno até', type: 'date' },
      { key: 'responsavel', label: 'Responsável', type: 'text' },
      { key: 'anexos', label: 'Anexos', type: 'text' },
      { key: 'visivel_cliente', label: 'Visível ao cliente', type: 'select', options: ['true', 'false'] },
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
      { key: 'tipo', label: 'Tipo', type: 'select', options: ['renda', 'despesa', 'mínimo existencial', 'proposta', 'honorários', 'custo'] },
      { key: 'comprometimento', label: 'Comprometimento (%)', type: 'number' },
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

function auditKey(moduleKey) {
  return `${AUDIT_PREFIX}${moduleKey}`;
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

function addLocalTimelineEvent(moduleKey, recordId, type, detail, payload = {}) {
  const events = parseJson(timelineKey(moduleKey), []);
  const event = {
    id: makeId(),
    recordId,
    type,
    detail,
    payload,
    createdAt: nowIso(),
  };
  events.unshift(event);
  persistJson(timelineKey(moduleKey), events.slice(0, 300));
  const audit = parseJson(auditKey(moduleKey), []);
  audit.unshift(event);
  persistJson(auditKey(moduleKey), audit.slice(0, 500));
  return event;
}

function mapRemoteRow(row) {
  return {
    id: row.id,
    ...(row.record_data || {}),
    status: row.status,
    archived: Boolean(row.archived_at),
    source: 'supabase',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
    deletedAt: row.deleted_at,
  };
}

function toRemotePayload(moduleKey, payload = {}) {
  const status = payload.status || getAdvogadoModuleConfig(moduleKey)?.status?.[0] || 'ativo';
  const archivedAt = payload.archived === true ? (payload.archivedAt || nowIso()) : null;
  const { id, source, createdAt, updatedAt, archivedAt: _archivedAt, deletedAt, ...recordData } = payload;
  return {
    module_key: moduleKey,
    status,
    archived_at: archivedAt,
    record_data: recordData,
  };
}

async function getCurrentUserId() {
  const supabase = await getSupabaseClient();
  const { data } = await supabase.auth.getUser();
  return data?.user?.id || null;
}

async function getCurrentWorkspaceId() {
  if (!currentWorkspacePromise) {
    currentWorkspacePromise = getSupabaseClient()
      .then(supabase => supabase.rpc('current_workspace_id'))
      .then(({ data, error }) => error ? null : data)
      .catch(() => null);
  }
  return currentWorkspacePromise;
}

async function writeAudit(moduleKey, recordId, action, payload = {}) {
  const supabase = await getSupabaseClient();
  const actor = await getCurrentUserId().catch(() => null);
  const { error } = await supabase
    .from(AUDIT_TABLE)
    .insert({
      record_id: recordId,
      module_key: moduleKey,
      action,
      payload,
      actor_uid: actor,
    });

  if (error) {
    addLocalTimelineEvent(moduleKey, recordId, action, `Auditoria local: ${action}`, payload);
  }
}

export function getAdvogadoModuleConfig(moduleKey) {
  return ADVOGADO_MODULES[moduleKey] || null;
}

export async function listAdvogadoRecords(moduleKey) {
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase
    .from(OPERATIONAL_TABLE)
    .select('*')
    .eq('module_key', moduleKey)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false });

  if (!error) return (data || []).map(mapRemoteRow);

  console.warn('[RegistroAdvogadoService] Supabase list fallback:', error.message);
  return parseJson(storageKey(moduleKey), []);
}

export async function saveAdvogadoRecord(moduleKey, payload, existingId = null) {
  const config = getAdvogadoModuleConfig(moduleKey);
  if (!config) throw new Error('Módulo não encontrado');

  const timestamp = nowIso();
  const normalized = {
    ...payload,
    status: payload.status || config.status[0],
    archived: payload.archived === true,
    source: 'local',
    updatedAt: timestamp,
  };

  const remotePayload = toRemotePayload(moduleKey, normalized);
  const workspaceId = await getCurrentWorkspaceId();
  if (workspaceId && !remotePayload.workspace_id) remotePayload.workspace_id = workspaceId;

  if (existingId) {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from(OPERATIONAL_TABLE)
      .update({ ...remotePayload, updated_by: await getCurrentUserId().catch(() => null) })
      .eq('id', existingId)
      .select()
      .maybeSingle();

    if (!error && data) {
      await writeAudit(moduleKey, existingId, 'updated', normalized);
      return mapRemoteRow(data);
    }

    console.warn('[RegistroAdvogadoService] Supabase update fallback:', error?.message);
    const records = parseJson(storageKey(moduleKey), []);
    const index = records.findIndex(record => record.id === existingId);
    if (index < 0) throw new Error('Registro não encontrado');
    records[index] = { ...records[index], ...normalized };
    persistJson(storageKey(moduleKey), records);
    addLocalTimelineEvent(moduleKey, existingId, 'updated', 'Registro atualizado', normalized);
    return records[index];
  }

  const actor = await getCurrentUserId().catch(() => null);
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase
    .from(OPERATIONAL_TABLE)
    .insert({ ...remotePayload, created_by: actor, updated_by: actor })
    .select()
    .single();

  if (!error && data) {
    await writeAudit(moduleKey, data.id, 'created', normalized);
    return mapRemoteRow(data);
  }

  console.warn('[RegistroAdvogadoService] Supabase insert fallback:', error?.message);
  const records = parseJson(storageKey(moduleKey), []);
  const record = {
    id: makeId(),
    createdAt: timestamp,
    ...normalized,
  };
  records.unshift(record);
  persistJson(storageKey(moduleKey), records);
  addLocalTimelineEvent(moduleKey, record.id, 'created', 'Registro criado', normalized);
  return record;
}

export async function archiveAdvogadoRecord(moduleKey, recordId) {
  const timestamp = nowIso();
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase
    .from(OPERATIONAL_TABLE)
    .update({ archived_at: timestamp, status: 'arquivado', updated_by: await getCurrentUserId().catch(() => null) })
    .eq('id', recordId)
    .select()
    .maybeSingle();

  if (!error && data) {
    await writeAudit(moduleKey, recordId, 'archived', { archivedAt: timestamp });
    return mapRemoteRow(data);
  }

  console.warn('[RegistroAdvogadoService] Supabase archive fallback:', error?.message);
  const records = parseJson(storageKey(moduleKey), []);
  const index = records.findIndex(record => record.id === recordId);
  if (index < 0) return null;
  records[index] = {
    ...records[index],
    archived: true,
    status: 'arquivado',
    archivedAt: timestamp,
    updatedAt: timestamp,
  };
  persistJson(storageKey(moduleKey), records);
  addLocalTimelineEvent(moduleKey, recordId, 'archived', 'Registro arquivado', { archivedAt: timestamp });
  return records[index];
}

export async function deleteAdvogadoRecord(moduleKey, recordId) {
  const timestamp = nowIso();
  const supabase = await getSupabaseClient();
  const { error } = await supabase
    .from(OPERATIONAL_TABLE)
    .update({ deleted_at: timestamp, updated_by: await getCurrentUserId().catch(() => null) })
    .eq('id', recordId);

  if (!error) {
    await writeAudit(moduleKey, recordId, 'deleted', { deletedAt: timestamp });
    return;
  }

  console.warn('[RegistroAdvogadoService] Supabase delete fallback:', error.message);
  const records = parseJson(storageKey(moduleKey), []);
  const next = records.filter(record => record.id !== recordId);
  persistJson(storageKey(moduleKey), next);
  addLocalTimelineEvent(moduleKey, recordId, 'deleted', 'Registro excluído', { deletedAt: timestamp });
}

export async function listAdvogadoTimeline(moduleKey, recordId = null) {
  const supabase = await getSupabaseClient();
  let query = supabase
    .from(AUDIT_TABLE)
    .select('*')
    .eq('module_key', moduleKey)
    .order('created_at', { ascending: false })
    .limit(80);

  if (recordId) query = query.eq('record_id', recordId);

  const { data, error } = await query;
  if (!error) {
    return (data || []).map(event => ({
      id: event.id,
      recordId: event.record_id,
      type: event.action,
      detail: event.payload?.detail || `Registro ${event.action}`,
      payload: event.payload || {},
      createdAt: event.created_at,
    }));
  }

  const events = parseJson(timelineKey(moduleKey), []);
  return recordId ? events.filter(event => event.recordId === recordId) : events;
}

export async function listAdvogadoAudit(moduleKey, recordId = null) {
  return listAdvogadoTimeline(moduleKey, recordId);
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
