const INCOME_TYPES = ['renda_fixa', 'renda_variavel', 'beneficios', 'aposentadoria', 'pensao', 'renda_complementar'];
const MAX_INCOME = 4000;

export class IncomeEngine {
  constructor() {
    this._items = [];
  }

  register(payload = {}) {
    const type = payload.type || 'renda_fixa';
    const item = {
      income_id: payload.income_id || `inc_${Date.now()}`,
      type: INCOME_TYPES.includes(type) ? type : 'renda_complementar',
      amount: Number(payload.amount) || 0,
      recurrence: payload.recurrence || 'monthly',
      tenant_id: payload.tenant_id || 'hmadv',
      actor_id: payload.actor_id || 'system',
      created_at: new Date().toISOString(),
    };
    this._items.unshift(item);
    if (this._items.length > MAX_INCOME) this._items.length = MAX_INCOME;
    return item;
  }

  list(tenant_id = null) {
    if (!tenant_id) return [...this._items];
    return this._items.filter((item) => item.tenant_id === tenant_id);
  }
}

export const incomeEngine = new IncomeEngine();
