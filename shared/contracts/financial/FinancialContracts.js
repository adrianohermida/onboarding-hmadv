export * from './DebtContracts.js';
export * from './ExpenseContracts.js';
export * from './CommitmentContracts.js';
export * from './DiagnosisContracts.js';
export * from './PlanContracts.js';

export const DebtContract = {
  required: ['tenant_id', 'creditor', 'original_amount'],
};

export const PaymentPlanContract = {
  required: ['tenant_id', 'type', 'installments'],
};
