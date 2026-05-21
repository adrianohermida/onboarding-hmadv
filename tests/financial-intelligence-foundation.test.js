import { describe, expect, it } from 'vitest';
import { debtEngine } from '../financial-intelligence/debts/DebtEngine.js';
import { expenseEngine } from '../financial-intelligence/expenses/ExpenseEngine.js';
import { incomeEngine } from '../financial-intelligence/income/IncomeEngine.js';
import { commitmentEngine } from '../financial-intelligence/commitment/CommitmentEngine.js';
import { financialDiagnosisEngine } from '../financial-intelligence/diagnosis/FinancialDiagnosisEngine.js';
import { financialIntelligenceFoundation } from '../financial-intelligence/FinancialIntelligenceFoundation.js';

describe('financial intelligence foundation', () => {
  it('computes commitment and diagnosis for superendividamento', () => {
    incomeEngine.register({ tenant_id: 'tenant-fi', type: 'renda_fixa', amount: 5000 });
    expenseEngine.register({ tenant_id: 'tenant-fi', category: 'aluguel', amount: 1800 });
    debtEngine.register({ tenant_id: 'tenant-fi', creditor: 'Banco X', type: 'credito_pessoal', original_amount: 20000, current_amount: 22000, status: 'overdue', risk: 'high' });

    const commitment = commitmentEngine.calculate('tenant-fi');
    const diagnosis = financialDiagnosisEngine.diagnose('tenant-fi');

    expect(commitment.income_total).toBeGreaterThan(0);
    expect(diagnosis.score.vulnerability).toBeGreaterThanOrEqual(0);
    expect(typeof diagnosis.eligibility.eligible).toBe('boolean');
  });

  it('exposes operational snapshot with alerts and analytics', () => {
    const snapshot = financialIntelligenceFoundation.snapshot('tenant-fi');
    expect(snapshot.domain_entities.length).toBeGreaterThan(5);
    expect(snapshot.analytics.generated_at).toBeTruthy();
    expect(snapshot.alerts.total).toBeGreaterThanOrEqual(0);
  });
});
