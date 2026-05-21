export function normalizePlanPayload(payload = {}) {
  return {
    plan_id: payload.plan_id || null,
    tenant_id: payload.tenant_id || 'hmadv',
    type: payload.type || 'renegociacao',
    installments: Number(payload.installments) || 12,
    sustainable: payload.sustainable !== false,
    projection_ref: payload.projection_ref || null,
    timestamp: payload.timestamp || new Date().toISOString(),
  };
}
