import { incomeEngine } from '../income/IncomeEngine.js';
import { debtEngine } from '../debts/DebtEngine.js';
import { expenseEngine } from '../expenses/ExpenseEngine.js';
import { minimumExistentialEngine } from '../minimum-existential/MinimumExistentialEngine.js';

export class CommitmentEngine {
  calculate(tenant_id = 'hmadv') {
    const incomeTotal = incomeEngine.list(tenant_id).reduce((sum, item) => sum + item.amount, 0);
    const debtTotal = debtEngine.list(tenant_id).reduce((sum, item) => sum + item.current_amount, 0);
    const expenses = expenseEngine.list(tenant_id);
    const essentialTotal = expenses.filter((item) => item.essential).reduce((sum, item) => sum + item.amount, 0);
    const expenseTotal = expenses.reduce((sum, item) => sum + item.amount, 0);
    const min = minimumExistentialEngine.calculate({ tenant_id });

    const commitmentIncome = incomeTotal > 0 ? debtTotal / incomeTotal : 0;
    const commitmentEssential = incomeTotal > 0 ? essentialTotal / incomeTotal : 0;
    const netIncome = Math.max(incomeTotal - min.minimum_existential, 0);
    const commitmentAfterMinimum = netIncome > 0 ? debtTotal / netIncome : debtTotal > 0 ? 1 : 0;
    const paymentCapacity = Math.max(incomeTotal - expenseTotal - min.minimum_existential, 0);

    return {
      tenant_id,
      income_total: incomeTotal,
      debt_total: debtTotal,
      essential_total: essentialTotal,
      expense_total: expenseTotal,
      commitment_income: commitmentIncome,
      commitment_essential: commitmentEssential,
      commitment_net: incomeTotal > 0 ? expenseTotal / incomeTotal : 0,
      commitment_after_minimum: commitmentAfterMinimum,
      payment_capacity: paymentCapacity,
      calculated_at: new Date().toISOString(),
    };
  }
}

export const commitmentEngine = new CommitmentEngine();
