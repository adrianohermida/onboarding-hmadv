import { workflowTelemetry } from '../telemetry/WorkflowTelemetry.js';

export function evaluateFinancialMonitoring(payload = {}) {
  const income = Number(payload.renda || payload.income || 0);
  const commitments = Number(payload.comprometimento || payload.commitments || 0);
  const debt = Number(payload.divida_total || payload.debt || 0);
  const ratio = income > 0 ? commitments / income : 0;

  const signals = {
    debt_worsening: debt > Number(payload.previous_debt || debt),
    income_commitment_high: ratio > 0.55,
    recurring_delay: !!payload.recurring_delay,
    score_deterioration: Number(payload.score_delta || 0) < 0,
  };

  workflowTelemetry.record({
    workflow: 'financial-monitoring',
    tenant_id: payload.tenant_id || 'hmadv',
    throughput: 1,
    failures: 0,
    retries: 0,
  });

  return signals;
}
