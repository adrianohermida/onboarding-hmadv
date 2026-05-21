export class FinancialScoreEngine {
  calculate(payload = {}) {
    const commitment = Number(payload.commitment_after_minimum) || 0;
    const overdueDebt = Number(payload.overdue_debt_ratio) || 0;
    const recurringDelay = Number(payload.recurring_delay_ratio) || 0;

    const vulnerability = Math.min(100, Math.round((commitment * 45 + overdueDebt * 35 + recurringDelay * 20) * 100));
    const risk = Math.min(100, Math.round((commitment * 40 + overdueDebt * 40 + recurringDelay * 20) * 100));
    const aggravation = Math.min(100, Math.round((overdueDebt * 50 + recurringDelay * 50) * 100));
    const stability = Math.max(0, 100 - vulnerability);
    const inadimplencia = Math.min(100, Math.round((overdueDebt * 70 + recurringDelay * 30) * 100));
    const collapse = Math.min(100, Math.round((commitment * 60 + overdueDebt * 40) * 100));

    return {
      tenant_id: payload.tenant_id || 'hmadv',
      vulnerability,
      risk,
      aggravation,
      stability,
      inadimplencia,
      collapse,
      calculated_at: new Date().toISOString(),
    };
  }
}

export const financialScoreEngine = new FinancialScoreEngine();
