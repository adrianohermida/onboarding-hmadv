const CNJ_TOTAL_STEPS = 7;

export function clampCnjStep(step) {
  const parsed = Number(step) || 0;
  return Math.max(0, Math.min(CNJ_TOTAL_STEPS, parsed));
}

export function formatCaseFlowDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('pt-BR');
}

export function buildCaseContextQuery({ source = null, clientId = null, formulario = null } = {}) {
  const params = new URLSearchParams();
  if (source) params.set('source', source);
  if (clientId) params.set('client', clientId);
  if (formulario) params.set('formulario', formulario);
  return params.toString();
}

export function buildCaseContextHref(pageKey, options = {}) {
  const query = buildCaseContextQuery(options);
  return `${pageKey}.html${query ? `?${query}` : ''}`;
}

export function getCaseFlowSummary(caso = {}, { workflowStatus = null } = {}) {
  const step = clampCnjStep(caso?.cnj_step_atual);
  const done = Boolean(caso?.onboarding_done);
  const updatedAt = caso?.updated_at || caso?.created_at || null;

  if (done) {
    if (workflowStatus === 'aprovado') {
      return {
        key: 'approved',
        tone: 'ok',
        label: 'Aprovado',
        detail: 'Formulário e jornada aprovados pelo escritório.',
        step: CNJ_TOTAL_STEPS,
        progressPct: 100,
        updatedAt,
      };
    }

    if (workflowStatus === 'rejeitado' || workflowStatus === 'pendente_correcao') {
      return {
        key: 'correction',
        tone: 'danger',
        label: 'Correção',
        detail: 'O escritório devolveu o formulário para ajustes.',
        step: CNJ_TOTAL_STEPS,
        progressPct: 100,
        updatedAt,
      };
    }

    return {
      key: 'submitted',
      tone: 'warn',
      label: 'Enviado',
      detail: 'Fluxo concluído pelo cliente e aguardando análise.',
      step: CNJ_TOTAL_STEPS,
      progressPct: 100,
      updatedAt,
    };
  }

  if (step > 0) {
    return {
      key: 'in_progress',
      tone: 'info',
      label: 'Em progresso',
      detail: `Último salvamento no passo ${step}/${CNJ_TOTAL_STEPS}.`,
      step,
      progressPct: Math.round((step / CNJ_TOTAL_STEPS) * 100),
      updatedAt,
    };
  }

  return {
    key: 'not_started',
    tone: 'muted',
    label: 'Não iniciado',
    detail: 'O cliente ainda não começou o formulário CNJ.',
    step: 0,
    progressPct: 0,
    updatedAt,
  };
}