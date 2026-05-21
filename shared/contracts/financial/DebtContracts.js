export function normalizeDebtPayload(payload = {}) {
  return {
    debt_id: payload.debt_id || null,
    creditor: payload.creditor || 'unknown',
    type: payload.type || 'unknown',
    original_amount: Number(payload.original_amount) || 0,
    current_amount: Number(payload.current_amount) || Number(payload.original_amount) || 0,
    due_date: payload.due_date || null,
    status: payload.status || 'open',
    recurrence: payload.recurrence || 'none',
    tenant_id: payload.tenant_id || 'hmadv',
    actor_id: payload.actor_id || 'system',
    timestamp: payload.timestamp || new Date().toISOString(),
  };
}
