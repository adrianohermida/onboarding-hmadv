const ESSENTIAL_CATEGORIES = [
  'alimentacao',
  'agua',
  'energia',
  'aluguel',
  'saude',
  'medicamentos',
  'transporte',
  'educacao',
  'internet',
  'moradia',
];

const NON_ESSENTIAL_CATEGORIES = ['lazer', 'assinatura', 'superfluos', 'gastos_variaveis'];

const MAX_EXPENSES = 6000;

export class ExpenseEngine {
  constructor() {
    this._items = [];
  }

  register(payload = {}) {
    const category = payload.category || 'gastos_variaveis';
    const item = {
      expense_id: payload.expense_id || `exp_${Date.now()}`,
      category,
      essential: ESSENTIAL_CATEGORIES.includes(category),
      non_essential: NON_ESSENTIAL_CATEGORIES.includes(category),
      amount: Number(payload.amount) || 0,
      tenant_id: payload.tenant_id || 'hmadv',
      actor_id: payload.actor_id || 'system',
      created_at: new Date().toISOString(),
    };
    this._items.unshift(item);
    if (this._items.length > MAX_EXPENSES) this._items.length = MAX_EXPENSES;
    return item;
  }

  list(tenant_id = null) {
    if (!tenant_id) return [...this._items];
    return this._items.filter((item) => item.tenant_id === tenant_id);
  }

  static categories() {
    return {
      essential: [...ESSENTIAL_CATEGORIES],
      non_essential: [...NON_ESSENTIAL_CATEGORIES],
    };
  }
}

export const expenseEngine = new ExpenseEngine();
