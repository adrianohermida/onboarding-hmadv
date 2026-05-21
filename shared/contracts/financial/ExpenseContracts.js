export function normalizeExpensePayload(payload = {}) {
  return {
    expense_id: payload.expense_id || null,
    category: payload.category || 'gastos_variaveis',
    amount: Number(payload.amount) || 0,
    recurrence: payload.recurrence || 'monthly',
    impact: payload.impact || 'medium',
    tenant_id: payload.tenant_id || 'hmadv',
    actor_id: payload.actor_id || 'system',
    timestamp: payload.timestamp || new Date().toISOString(),
  };
}
