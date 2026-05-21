export const FINANCIAL_DOMAIN_ENTITIES = [
  'Debt',
  'Creditor',
  'Expense',
  'ExpenseCategory',
  'EssentialExpense',
  'Income',
  'FinancialProfile',
  'CommitmentProfile',
  'FinancialDiagnosis',
  'MinimumExistentialProfile',
  'FinancialScore',
  'FinancialRisk',
  'PaymentCapacity',
  'DebtTimeline',
  'PaymentEvent',
  'NegotiationEvent',
  'FinancialProjection',
];

export function listFinancialDomainEntities() {
  return [...FINANCIAL_DOMAIN_ENTITIES];
}
