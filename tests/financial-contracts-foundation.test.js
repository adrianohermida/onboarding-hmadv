import { describe, expect, it } from 'vitest';
import { normalizeDebtPayload } from '../shared/contracts/financial/DebtContracts.js';
import { normalizeExpensePayload } from '../shared/contracts/financial/ExpenseContracts.js';
import { normalizeCommitmentPayload } from '../shared/contracts/financial/CommitmentContracts.js';
import { normalizeDiagnosisPayload } from '../shared/contracts/financial/DiagnosisContracts.js';
import { normalizePlanPayload } from '../shared/contracts/financial/PlanContracts.js';

describe('financial contracts foundation', () => {
  it('normalizes debt and expense payloads', () => {
    const debt = normalizeDebtPayload({ creditor: 'Banco', original_amount: 1000, tenant_id: 'tenant-fc' });
    const expense = normalizeExpensePayload({ category: 'aluguel', amount: 1200, tenant_id: 'tenant-fc' });
    expect(debt.tenant_id).toBe('tenant-fc');
    expect(expense.amount).toBe(1200);
  });

  it('normalizes commitment, diagnosis and plan payloads', () => {
    const commitment = normalizeCommitmentPayload({ tenant_id: 'tenant-fc', payment_capacity: 500 });
    const diagnosis = normalizeDiagnosisPayload({ tenant_id: 'tenant-fc', vulnerabilidade: 70 });
    const plan = normalizePlanPayload({ tenant_id: 'tenant-fc', installments: 24 });
    expect(commitment.payment_capacity).toBe(500);
    expect(diagnosis.vulnerabilidade).toBe(70);
    expect(plan.installments).toBe(24);
  });
});
