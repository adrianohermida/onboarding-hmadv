const MAX_RECURRING = 4000;

export class RecurringExpenseEngine {
  constructor() {
    this._items = [];
  }

  register(payload = {}) {
    const item = {
      recurring_id: payload.recurring_id || `rexp_${Date.now()}`,
      expense_id: payload.expense_id || null,
      recurrence: payload.recurrence || 'monthly',
      periodicity: payload.periodicity || 'monthly',
      forecast_amount: Number(payload.forecast_amount) || 0,
      delay_days: Number(payload.delay_days) || 0,
      impact: payload.impact || 'medium',
      payment_confirmed: !!payload.payment_confirmed,
      tenant_id: payload.tenant_id || 'hmadv',
      actor_id: payload.actor_id || 'system',
      updated_at: new Date().toISOString(),
    };
    this._items.unshift(item);
    if (this._items.length > MAX_RECURRING) this._items.length = MAX_RECURRING;
    return item;
  }

  list(tenant_id = null) {
    if (!tenant_id) return [...this._items];
    return this._items.filter((item) => item.tenant_id === tenant_id);
  }
}

export const recurringExpenseEngine = new RecurringExpenseEngine();
