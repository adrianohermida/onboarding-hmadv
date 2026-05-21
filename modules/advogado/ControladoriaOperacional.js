export const PERFIS_OPERACIONAIS = ['advogado', 'colaborador', 'financeiro', 'administrador'];
export const PRIORIDADES_OPERACIONAIS = ['baixa', 'media', 'alta', 'critica'];

function toDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function hoursBetween(start, end) {
  return (end.getTime() - start.getTime()) / 36e5;
}

export function resolveOperationalDueAt(record = {}) {
  return toDate(record.prazo || record.data || record.vencimento || record.lembrete_em);
}

export function resolveOperationalSla(record = {}, now = new Date()) {
  const dueAt = resolveOperationalDueAt(record);
  const slaHours = Number(record.sla_horas || record.sla || 0);
  const status = String(record.status || '');
  const done = ['concluida', 'realizado', 'arquivado'].includes(status);
  const remainingHours = dueAt ? hoursBetween(now, dueAt) : null;
  const breached = !done && dueAt && remainingHours < 0;
  const criticalWindow = Number.isFinite(remainingHours) && remainingHours <= Math.max(4, slaHours * 0.25);

  let state = 'sem_prazo';
  if (done) state = 'concluido';
  else if (breached) state = 'estourado';
  else if (criticalWindow) state = 'alerta';
  else if (dueAt) state = 'no_prazo';

  return {
    state,
    dueAt: dueAt?.toISOString() || null,
    slaHours,
    remainingHours: Number.isFinite(remainingHours) ? Math.round(remainingHours) : null,
    breached: Boolean(breached),
    reminderAt: record.lembrete_em || null,
  };
}

export function buildOperationalControl(records = [], moduleKey = 'tarefas', now = new Date()) {
  const active = records.filter(record => !record.archived);
  const timeline = active
    .map(record => ({ record, sla: resolveOperationalSla(record, now) }))
    .sort((a, b) => {
      const aTime = a.sla.dueAt ? new Date(a.sla.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
      const bTime = b.sla.dueAt ? new Date(b.sla.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
      return aTime - bTime;
    });

  const byState = timeline.reduce((acc, item) => {
    acc[item.sla.state] = (acc[item.sla.state] || 0) + 1;
    return acc;
  }, {});

  const byProfile = active.reduce((acc, record) => {
    const key = record.perfil_responsavel || record.perfil || 'colaborador';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const priorityQueue = timeline
    .filter(item => !['concluido'].includes(item.sla.state))
    .sort((a, b) => {
      const priorityScore = { critica: 4, alta: 3, media: 2, baixa: 1 };
      return (priorityScore[b.record.prioridade] || 0) - (priorityScore[a.record.prioridade] || 0);
    })
    .slice(0, 6);

  return {
    moduleKey,
    total: active.length,
    overdue: byState.estourado || 0,
    warning: byState.alerta || 0,
    onTime: byState.no_prazo || 0,
    done: byState.concluido || 0,
    withoutDue: byState.sem_prazo || 0,
    byProfile,
    timeline,
    priorityQueue,
  };
}

export function buildOperationalNotification(record = {}, sla = resolveOperationalSla(record)) {
  const title = record.titulo || record.cliente || record.assunto || 'Pendência operacional';
  if (sla.state === 'estourado') return { tone: 'danger', title: 'SLA vencido', text: title };
  if (sla.state === 'alerta') return { tone: 'warn', title: 'SLA próximo', text: title };
  return { tone: 'brand', title: 'Controle operacional', text: title };
}
