import { incomeEngine } from '../income/IncomeEngine.js';
import { expenseEngine } from '../expenses/ExpenseEngine.js';
import { debtEngine } from '../debts/DebtEngine.js';

export class MonthlyUpdateEngine {
  apply(payload = {}) {
    const tenant_id = payload.tenant_id || 'hmadv';

    (payload.income_updates || []).forEach((item) => incomeEngine.register({ ...item, tenant_id }));
    (payload.expense_updates || []).forEach((item) => expenseEngine.register({ ...item, tenant_id }));
    (payload.debt_updates || []).forEach((item) => debtEngine.register({ ...item, tenant_id }));

    return {
      tenant_id,
      income_updates: (payload.income_updates || []).length,
      expense_updates: (payload.expense_updates || []).length,
      debt_updates: (payload.debt_updates || []).length,
      payments_updates: (payload.payments_updates || []).length,
      inadimplencia_updates: (payload.inadimplencia_updates || []).length,
      applied_at: new Date().toISOString(),
    };
  }
}

export const monthlyUpdateEngine = new MonthlyUpdateEngine();
