import { debtEngine } from '../debts/DebtEngine.js';
import { incomeEngine } from '../income/IncomeEngine.js';
import { expenseEngine } from '../expenses/ExpenseEngine.js';
import { financialDiagnosisEngine } from '../diagnosis/FinancialDiagnosisEngine.js';

export class SuperendividamentoAnalytics {
  snapshot(tenant_id = 'hmadv') {
    const debts = debtEngine.list(tenant_id);
    const incomes = incomeEngine.list(tenant_id);
    const expenses = expenseEngine.list(tenant_id);
    const diagnosis = financialDiagnosisEngine.diagnose(tenant_id);

    const debtTotal = debts.reduce((sum, item) => sum + item.current_amount, 0);
    const incomeTotal = incomes.reduce((sum, item) => sum + item.amount, 0);
    const expenseTotal = expenses.reduce((sum, item) => sum + item.amount, 0);

    return {
      tenant_id,
      dashboards: {
        debt_evolution: debtTotal,
        income_evolution: incomeTotal,
        expense_evolution: expenseTotal,
        risk_evolution: diagnosis.score.risk,
        score_evolution: diagnosis.score.vulnerability,
      },
      diagnosis,
      generated_at: new Date().toISOString(),
    };
  }
}

export const superendividamentoAnalytics = new SuperendividamentoAnalytics();
