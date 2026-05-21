export function normalizeCommitmentPayload(payload = {}) {
  return {
    tenant_id: payload.tenant_id || 'hmadv',
    income_total: Number(payload.income_total) || 0,
    debt_total: Number(payload.debt_total) || 0,
    essential_total: Number(payload.essential_total) || 0,
    commitment_after_minimum: Number(payload.commitment_after_minimum) || 0,
    payment_capacity: Number(payload.payment_capacity) || 0,
    timestamp: payload.timestamp || new Date().toISOString(),
  };
}
