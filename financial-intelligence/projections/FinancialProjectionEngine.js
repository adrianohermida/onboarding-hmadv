export class FinancialProjectionEngine {
  project(payload = {}) {
    const months = Number(payload.months) || 12;
    const income = Number(payload.income_monthly) || 0;
    const expenses = Number(payload.expenses_monthly) || 0;
    const debt = Number(payload.debt_monthly) || 0;

    const list = Array.from({ length: months }).map((_, i) => ({
      month: i + 1,
      cash_flow: income - expenses - debt,
      commitment_future: income > 0 ? debt / income : 0,
      sustainability: income - expenses - debt >= 0 ? 'sustainable' : 'unsustainable',
    }));

    return {
      tenant_id: payload.tenant_id || 'hmadv',
      months,
      list,
      generated_at: new Date().toISOString(),
    };
  }
}

export const financialProjectionEngine = new FinancialProjectionEngine();
