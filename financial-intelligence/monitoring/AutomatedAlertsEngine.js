import { financialMonitoringEngine } from './FinancialMonitoringEngine.js';

export class AutomatedAlertsEngine {
  run(tenant_id = 'hmadv') {
    const evalResult = financialMonitoringEngine.evaluate(tenant_id);
    const alerts = [];

    if (evalResult.overdue_count > 0) alerts.push({ level: 'warn', type: 'divida_vencida', message: 'Dividas vencidas detectadas.' });
    if (evalResult.commitment_after_minimum > 0.7) alerts.push({ level: 'warn', type: 'comprometimento_aumentado', message: 'Comprometimento elevado apos minimo existencial.' });
    if (evalResult.commitment_after_minimum > 1) alerts.push({ level: 'critical', type: 'minimo_existencial_comprometido', message: 'Minimo existencial comprometido.' });
    if (evalResult.high_risk_debts > 0) alerts.push({ level: 'warn', type: 'risco_agravamento', message: 'Risco de agravamento financeiro detectado.' });
    if (evalResult.recurring_delay) alerts.push({ level: 'warn', type: 'atraso_recorrente', message: 'Atraso recorrente registrado.' });

    return {
      tenant_id,
      total: alerts.length,
      alerts,
      generated_at: new Date().toISOString(),
    };
  }
}

export const automatedAlertsEngine = new AutomatedAlertsEngine();
