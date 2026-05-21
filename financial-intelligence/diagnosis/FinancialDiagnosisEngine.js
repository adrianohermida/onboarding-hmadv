import { commitmentEngine } from '../commitment/CommitmentEngine.js';
import { financialScoreEngine } from '../scores/FinancialScoreEngine.js';
import { eligibilityEngine } from '../eligibility/EligibilityEngine.js';

export class FinancialDiagnosisEngine {
  diagnose(tenant_id = 'hmadv') {
    const commitment = commitmentEngine.calculate(tenant_id);
    const score = financialScoreEngine.calculate({
      tenant_id,
      commitment_after_minimum: commitment.commitment_after_minimum,
      overdue_debt_ratio: Math.min(1, commitment.commitment_income),
      recurring_delay_ratio: commitment.commitment_after_minimum > 0.8 ? 0.7 : 0.3,
    });

    const eligibility = eligibilityEngine.analyze({
      tenant_id,
      commitment_after_minimum: commitment.commitment_after_minimum,
      vulnerability: score.vulnerability,
      minimum_existential_compromised: commitment.commitment_after_minimum > 1,
    });

    return {
      tenant_id,
      commitment,
      score,
      eligibility,
      superendividamento_situacao: eligibility.lei_superendividamento,
      social_risk: score.risk,
      generated_at: new Date().toISOString(),
    };
  }
}

export const financialDiagnosisEngine = new FinancialDiagnosisEngine();
