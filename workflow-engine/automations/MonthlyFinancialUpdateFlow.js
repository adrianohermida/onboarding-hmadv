import { bus } from '../../modules/events/EventBus.js';
import { evaluateFinancialMonitoring } from './FinancialMonitoringAutomation.js';

export function applyMonthlyFinancialUpdate(payload = {}) {
  const tenant_id = payload.tenant_id || 'hmadv';
  const workflow_id = payload.workflow_id || `monthly_financial_${Date.now()}`;
  const trace_id = payload.trace_id || null;

  const signals = evaluateFinancialMonitoring(payload);

  bus.emit('financial.updated.monthly', {
    tenant_id,
    workflow_id,
    updates: {
      renda: payload.renda,
      despesas: payload.despesas,
      dividas: payload.dividas,
      pagamentos: payload.pagamentos,
      atraso: payload.atraso,
      renegociacao: payload.renegociacao,
    },
    signals,
  }, {
    tenant_id,
    workflow_id,
    trace_id,
    source_module: 'workflow-engine.monthly-financial-update',
  });

  return { ok: true, tenant_id, workflow_id, signals };
}
