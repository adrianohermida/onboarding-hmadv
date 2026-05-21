import { expenseEngine } from '../expenses/ExpenseEngine.js';

export class MinimumExistentialEngine {
  calculate(payload = {}) {
    const dependents = Number(payload.dependents) || 0;
    const familyCore = Number(payload.family_core) || 1;
    const base = Number(payload.base_value) || 1518;
    const essentialExpenses = expenseEngine.list(payload.tenant_id).filter((item) => item.essential);
    const essentialTotal = essentialExpenses.reduce((sum, item) => sum + item.amount, 0);
    const dignityProtection = base * familyCore + dependents * (base * 0.5);
    const minimumExistential = Math.max(dignityProtection, essentialTotal);

    return {
      tenant_id: payload.tenant_id || 'hmadv',
      base_value: base,
      family_core: familyCore,
      dependents,
      essential_total: essentialTotal,
      dignity_protection: dignityProtection,
      minimum_existential: minimumExistential,
      law_reference: 'Lei 14.181/2021',
      calculated_at: new Date().toISOString(),
    };
  }
}

export const minimumExistentialEngine = new MinimumExistentialEngine();
