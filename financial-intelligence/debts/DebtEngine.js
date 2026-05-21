const MAX_DEBTS = 5000;

export class DebtEngine {
  constructor() {
    this._items = [];
  }

  register(payload = {}) {
    const debt = {
      debt_id: payload.debt_id || `debt_${Date.now()}`,
      creditor: payload.creditor || 'unknown',
      type: payload.type || 'unknown',
      original_amount: Number(payload.original_amount) || 0,
      current_amount: Number(payload.current_amount) || Number(payload.original_amount) || 0,
      interest_rate: Number(payload.interest_rate) || 0,
      installments: Number(payload.installments) || 1,
      due_date: payload.due_date || null,
      status: payload.status || 'open',
      recurrence: payload.recurrence || 'none',
      priority: payload.priority || 'medium',
      negativacao: !!payload.negativacao,
      judicializacao: !!payload.judicializacao,
      risk: payload.risk || 'moderate',
      tenant_id: payload.tenant_id || 'hmadv',
      actor_id: payload.actor_id || 'system',
      created_at: new Date().toISOString(),
    };

    this._items.unshift(debt);
    if (this._items.length > MAX_DEBTS) this._items.length = MAX_DEBTS;
    return debt;
  }

  list(tenant_id = null) {
    if (!tenant_id) return [...this._items];
    return this._items.filter((item) => item.tenant_id === tenant_id);
  }
}

export const debtEngine = new DebtEngine();
