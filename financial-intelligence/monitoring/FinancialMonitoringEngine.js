import { debtEngine } from '../debts/DebtEngine.js';
import { commitmentEngine } from '../commitment/CommitmentEngine.js';

export class FinancialMonitoringEngine {
  evaluate(tenant_id = 'hmadv') {
    const debts = debtEngine.list(tenant_id);
    const overdue = debts.filter((item) => item.status === 'overdue').length;
    const highRisk = debts.filter((item) => ['high', 'critical'].includes(item.risk)).length;
    const commitment = commitmentEngine.calculate(tenant_id);

    return {
      tenant_id,
      debt_growth: debts.length,
      overdue_count: overdue,
      high_risk_debts: highRisk,
      commitment_after_minimum: commitment.commitment_after_minimum,
      recurring_delay: overdue > 0,
      financial_collapse_risk: commitment.commitment_after_minimum > 1,
      evaluated_at: new Date().toISOString(),
    };
  }
}

export const financialMonitoringEngine = new FinancialMonitoringEngine();
