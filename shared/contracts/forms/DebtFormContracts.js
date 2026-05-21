export const DebtFormContract = {
  required: ['tenant_id', 'case_id', 'debts'],
};

export const FinancialFormContract = {
  required: ['tenant_id', 'case_id', 'expenses', 'income'],
};

export const DocumentFormContract = {
  required: ['tenant_id', 'case_id', 'documents'],
};
