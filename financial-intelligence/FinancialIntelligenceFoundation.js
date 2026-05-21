import { bus } from '../modules/events/EventBus.js';
import { debtEngine } from './debts/DebtEngine.js';
import { expenseEngine } from './expenses/ExpenseEngine.js';
import { recurringExpenseEngine } from './expenses/RecurringExpenseEngine.js';
import { incomeEngine } from './income/IncomeEngine.js';
import { commitmentEngine } from './commitment/CommitmentEngine.js';
import { minimumExistentialEngine } from './minimum-existential/MinimumExistentialEngine.js';
import { financialDiagnosisEngine } from './diagnosis/FinancialDiagnosisEngine.js';
import { financialTimelineEngine } from './timelines/FinancialTimelineEngine.js';
import { paymentTrackingEngine } from './monitoring/PaymentTrackingEngine.js';
import { monthlyUpdateEngine } from './monitoring/MonthlyUpdateEngine.js';
import { financialMonitoringEngine } from './monitoring/FinancialMonitoringEngine.js';
import { automatedAlertsEngine } from './monitoring/AutomatedAlertsEngine.js';
import { financialSimulationEngine } from './simulations/FinancialSimulationEngine.js';
import { paymentPlanFoundation } from './plans/PaymentPlanFoundation.js';
import { financialProjectionEngine } from './projections/FinancialProjectionEngine.js';
import { superendividamentoAnalytics } from './analytics/SuperendividamentoAnalytics.js';
import { financialTelemetry } from './telemetry/FinancialTelemetry.js';
import { listFinancialDomainEntities } from './FinancialDomainModel.js';

let mounted = false;
let offs = [];

function trackUpdate(event, payload = {}, envelope = {}) {
  financialTimelineEngine.add({
    type: event,
    tenant_id: envelope.tenant_id || payload.tenant_id || 'hmadv',
    actor_id: envelope.actor_id || payload.actor_id || 'system',
    details: payload,
    score_impact: Number(payload.score_impact) || 0,
  });

  financialTelemetry.track({
    event,
    tenant_id: envelope.tenant_id || payload.tenant_id || 'hmadv',
    actor_id: envelope.actor_id || payload.actor_id || 'system',
    workflow_id: envelope.workflow_id || null,
    trace_id: envelope.trace_id || envelope.correlation_id || null,
    inputs: payload,
    outputs: {},
    score_impact: Number(payload.score_impact) || 0,
  });
}

export function mountFinancialIntelligenceFoundation() {
  if (mounted) return;
  mounted = true;

  offs = [
    bus.on('financial.updated.monthly', (payload, envelope) => {
      const result = monthlyUpdateEngine.apply(payload);
      trackUpdate('financial.updated.monthly', payload, envelope);
      financialTelemetry.track({
        event: 'financial.updated.monthly.result',
        tenant_id: result.tenant_id,
        actor_id: envelope.actor_id || 'system',
        inputs: payload,
        outputs: result,
      });
    }),
    bus.on('debt.updated', (payload, envelope) => {
      if (payload?.register_new_debt) debtEngine.register({ ...payload.register_new_debt, tenant_id: envelope.tenant_id || 'hmadv' });
      paymentTrackingEngine.updateDebt({ ...payload, tenant_id: envelope.tenant_id || payload.tenant_id || 'hmadv' });
      trackUpdate('debt.updated', payload, envelope);
    }),
    bus.on('payment.confirmed', (payload, envelope) => {
      paymentTrackingEngine.confirmPayment({ ...payload, tenant_id: envelope.tenant_id || payload.tenant_id || 'hmadv' });
      trackUpdate('payment.confirmed', payload, envelope);
    }),
    bus.on('payment.delayed', (payload, envelope) => {
      paymentTrackingEngine.reportDelay({ ...payload, tenant_id: envelope.tenant_id || payload.tenant_id || 'hmadv' });
      trackUpdate('payment.delayed', payload, envelope);
    }),
    bus.on('payment.renegotiated', (payload, envelope) => {
      paymentTrackingEngine.reportNegotiation({ ...payload, tenant_id: envelope.tenant_id || payload.tenant_id || 'hmadv' });
      trackUpdate('payment.renegotiated', payload, envelope);
    }),
  ];
}

export function unmountFinancialIntelligenceFoundation() {
  offs.forEach((off) => {
    try { off(); } catch (_) {}
  });
  offs = [];
  mounted = false;
}

export function collectFinancialIntelligenceSnapshot(tenant_id = 'hmadv') {
  const commitment = commitmentEngine.calculate(tenant_id);
  const minimum = minimumExistentialEngine.calculate({ tenant_id });
  const diagnosis = financialDiagnosisEngine.diagnose(tenant_id);
  const monitoring = financialMonitoringEngine.evaluate(tenant_id);
  const alerts = automatedAlertsEngine.run(tenant_id);

  return {
    domain_entities: listFinancialDomainEntities(),
    debts: debtEngine.list(tenant_id),
    expenses: expenseEngine.list(tenant_id),
    recurring_expenses: recurringExpenseEngine.list(tenant_id),
    income: incomeEngine.list(tenant_id),
    commitment,
    minimum_existential: minimum,
    diagnosis,
    monitoring,
    alerts,
    timeline: { total: financialTimelineEngine.list(tenant_id).length, list: financialTimelineEngine.list(tenant_id) },
    payment_tracking: { total: paymentTrackingEngine.list(tenant_id).length, list: paymentTrackingEngine.list(tenant_id) },
    simulation_example: financialSimulationEngine.simulate({ tenant_id, base_debt: 10000, reduction_rate: 0.2, installments: 24 }),
    projection_example: financialProjectionEngine.project({ tenant_id, income_monthly: commitment.income_total, expenses_monthly: commitment.expense_total, debt_monthly: commitment.debt_total / 12, months: 12 }),
    payment_plan_example: paymentPlanFoundation.build({ tenant_id, installments: 24 }),
    analytics: superendividamentoAnalytics.snapshot(tenant_id),
    telemetry: financialTelemetry.snapshot(),
    generated_at: new Date().toISOString(),
  };
}

export const financialIntelligenceFoundation = {
  mount: mountFinancialIntelligenceFoundation,
  unmount: unmountFinancialIntelligenceFoundation,
  snapshot: collectFinancialIntelligenceSnapshot,
};
