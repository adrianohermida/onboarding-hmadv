export function toClientViewModel(entity) {
  return {
    id: entity?.id || null,
    full_name: entity?.full_name || null,
    email: entity?.email || null,
    cpf: entity?.cpf || null,
    tenant_id: entity?.tenant_id || null,
  };
}

export function toDebtDto(entity) {
  return {
    id: entity?.id || null,
    amount: entity?.valor_total ?? entity?.amount ?? 0,
    status: entity?.status || 'open',
    tenant_id: entity?.tenant_id || null,
  };
}

export function toAnalyticsEventAdapter(input = {}) {
  return {
    tenant_id: input.tenant_id || null,
    metric: input.metric || 'unknown.metric',
    value: Number.isFinite(Number(input.value)) ? Number(input.value) : 0,
    timestamp: input.timestamp || new Date().toISOString(),
    metadata: input.metadata || {},
  };
}
