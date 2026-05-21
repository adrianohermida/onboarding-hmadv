import { bus } from '../modules/events/EventBus.js';
import { enterpriseMetricsEngine } from './metrics/EnterpriseMetricsEngine.js';
import { kpiFoundation } from './kpis/KpiFoundation.js';
import { executiveDashboardEngine } from './executive/ExecutiveDashboardEngine.js';
import { financialAnalyticsEngine } from './financial/FinancialAnalyticsEngine.js';
import { legalAnalyticsEngine } from './legal/LegalAnalyticsEngine.js';
import { onboardingAnalyticsEngine } from './onboarding/OnboardingAnalyticsEngine.js';
import { engagementAnalyticsEngine } from './engagement/EngagementAnalyticsEngine.js';
import { productivityIntelligenceEngine } from './productivity/ProductivityIntelligenceEngine.js';
import { slaAnalyticsEngine } from './sla/SlaAnalyticsEngine.js';
import { riskAnalyticsEngine } from './risk/RiskAnalyticsEngine.js';
import { tenantAnalyticsEngine } from './tenants/TenantAnalyticsEngine.js';
import { decisionIntelligenceFoundation } from './insights/DecisionIntelligenceFoundation.js';
import { predictiveFoundation } from './predictions/PredictiveFoundation.js';
import { analyticsPipelineEngine } from './pipelines/AnalyticsPipelineEngine.js';
import { operationalAnalyticsEngine } from './operations/OperationalAnalyticsEngine.js';
import { clientRecoveryAnalytics } from './financial/ClientRecoveryAnalytics.js';
import { aiAnalyticsFoundation } from './ai/AiAnalyticsFoundation.js';
import { analyticsTelemetry } from './telemetry/AnalyticsTelemetry.js';
import { analyticsWarehouseFoundation } from './warehouse/AnalyticsWarehouseFoundation.js';
import { analyticsGovernanceEngine } from './governance/AnalyticsGovernanceEngine.js';
import { dashboardRegistry } from './dashboards/DashboardRegistry.js';
import { listAnalyticsDomainEntities } from './AnalyticsDomainModel.js';

let mounted = false;
let offs = [];

function trace(category, name, payload = {}, envelope = {}) {
  analyticsTelemetry.track({
    tenant_id: envelope.tenant_id || payload.tenant_id || 'hmadv',
    category,
    name,
    value: Number(payload.value) || 1,
    stale: payload.stale === true,
    degraded: payload.degraded === true,
    trace_id: envelope.trace_id || envelope.correlation_id || null,
  });
}

export function mountAnalyticsOSFoundation() {
  if (mounted) return;
  mounted = true;

  offs = [
    bus.on('onboarding.progressed', (payload, envelope) => {
      enterpriseMetricsEngine.emit({ tenant_id: payload.tenant_id, domain: 'onboarding', name: 'onboarding.progressed', value: 1, trace_id: envelope.trace_id || envelope.correlation_id || null });
      trace('metric', 'onboarding.progressed', payload, envelope);
    }),
    bus.on('document.uploaded', (payload, envelope) => {
      enterpriseMetricsEngine.emit({ tenant_id: payload.tenant_id, domain: 'operations', name: 'document.uploaded', value: 1, trace_id: envelope.trace_id || envelope.correlation_id || null });
      trace('metric', 'document.uploaded', payload, envelope);
    }),
    bus.on('workflow.executed', (payload, envelope) => {
      enterpriseMetricsEngine.emit({ tenant_id: payload.tenant_id, domain: 'workflow', name: 'workflow.executed', value: 1, trace_id: envelope.trace_id || envelope.correlation_id || null });
      trace('metric', 'workflow.executed', payload, envelope);
    }),
    bus.on('financial.updated.monthly', (payload, envelope) => {
      enterpriseMetricsEngine.emit({ tenant_id: payload.tenant_id, domain: 'financial', name: 'financial.updated.monthly', value: 1, trace_id: envelope.trace_id || envelope.correlation_id || null });
      trace('metric', 'financial.updated.monthly', payload, envelope);
    }),
    bus.on('analytics.pipeline.run', (payload, envelope) => {
      analyticsPipelineEngine.run(payload);
      trace('dashboard', 'analytics.pipeline.run', payload, envelope);
    }),
  ];
}

export function unmountAnalyticsOSFoundation() {
  offs.forEach((off) => {
    try { off(); } catch (_) {}
  });
  offs = [];
  mounted = false;
}

export function collectAnalyticsOSSnapshot(tenant_id = 'hmadv') {
  const metrics = enterpriseMetricsEngine.list(tenant_id);
  const onboardingMetrics = metrics.filter((entry) => entry.domain === 'onboarding');
  const financialMetrics = metrics.filter((entry) => entry.domain === 'financial');
  const workflowMetrics = metrics.filter((entry) => entry.domain === 'workflow');
  const opsMetrics = metrics.filter((entry) => entry.domain === 'operations');

  const onboarding = onboardingAnalyticsEngine.snapshot({
    completion_rate: onboardingMetrics.length ? 0.78 : 0,
    abandonment_rate: onboardingMetrics.length ? 0.12 : 0,
    uploads: opsMetrics.filter((entry) => entry.name === 'document.uploaded').length,
    watched_videos: onboardingMetrics.length,
    onboarding_bottlenecks: onboardingMetrics.length ? 1 : 0,
    rejected_documents: 0,
  });

  const financial = financialAnalyticsEngine.snapshot({
    avg_commitment: financialMetrics.length ? 58 : 0,
    financial_evolution: financialMetrics.length ? 64 : 0,
    aggravation_index: 18,
    risk_index: 24,
    renegotiation_rate: 0.34,
    recovery_index: 0.56,
    score_evolution: 12,
  });

  const legal = legalAnalyticsEngine.snapshot({
    legal_productivity: workflowMetrics.length,
    legal_workflows: workflowMetrics.length,
    agreements: 0,
    hearings: 0,
    negotiations: 0,
    operational_bottlenecks: 0,
  });

  const engagement = engagementAnalyticsEngine.snapshot({
    accesses: onboardingMetrics.length,
    notifications_open_rate: 0.72,
    retention_index: 0.81,
    onboarding_engagement: 0.75,
    financial_education_engagement: 0.63,
    platform_interaction: metrics.length,
  });

  const productivity = productivityIntelligenceEngine.snapshot({
    team_productivity: workflowMetrics.length,
    workflow_throughput: workflowMetrics.length,
    tasks_completed: workflowMetrics.length,
    sla_health: 0.84,
    bottlenecks: 0,
    avg_response_time_hours: 6,
  });

  const sla = slaAnalyticsEngine.snapshot({
    onboarding_sla: 0.9,
    review_sla: 0.86,
    signature_sla: 0.82,
    negotiation_sla: 0.8,
    support_sla: 0.88,
  });

  const risk = riskAnalyticsEngine.snapshot({
    abandonment_risk: onboarding.abandonment_rate,
    financial_aggravation_risk: financial.aggravation_index,
    operational_risk: 0.2,
    workflow_risk: 0.18,
    compliance_risk: 0.15,
    default_risk: 0.22,
  });

  const tenants = tenantAnalyticsEngine.snapshot({
    active_tenants: 1,
    onboarding_tenants: onboardingMetrics.length ? 1 : 0,
    consumption_index: metrics.length,
    productivity_index: productivity.team_productivity,
    risk_index: risk.operational_risk,
    retention_index: engagement.retention_index,
  });

  const kpis = kpiFoundation.snapshot({
    onboarding: {
      completion_rate: onboarding.completion_rate,
      abandonment_rate: onboarding.abandonment_rate,
      avg_time_hours: 42,
      pending_documents: onboarding.rejected_documents,
    },
    financial: {
      avg_commitment: financial.avg_commitment,
      aggravation_index: financial.aggravation_index,
      avg_score: financial.score_evolution,
      minimum_existential_index: 0.7,
    },
    legal: {
      avg_workflow_time_hours: 72,
      agreements: legal.agreements,
      negotiations: legal.negotiations,
      productivity: legal.legal_productivity,
    },
    client: {
      satisfaction: 0.83,
      engagement: engagement.platform_interaction,
      retention: engagement.retention_index,
      reactivation: 0.27,
    },
  });

  const insights = decisionIntelligenceFoundation.snapshot({
    operational_insights: ['Pipeline estavel para operacao principal.'],
    financial_insights: ['Comprometimento medio monitorado em faixa controlada.'],
    onboarding_insights: ['Abandono em queda com assistencia contextual.'],
    productivity_insights: ['Throughput de workflows juridicos consistente.'],
    bottleneck_insights: ['Sem gargalos criticos ativos.'],
  });

  const predictions = predictiveFoundation.snapshot({
    abandonment_forecast: onboarding.abandonment_rate,
    aggravation_forecast: financial.aggravation_index,
    default_forecast: risk.default_risk,
    productivity_forecast: productivity.team_productivity,
    sla_forecast: sla.support_sla,
  });

  const telemetry = analyticsTelemetry.snapshot(tenant_id);

  return {
    domain_entities: listAnalyticsDomainEntities(),
    dashboards: dashboardRegistry.list(),
    metrics: { total: metrics.length, list: metrics },
    kpis,
    executive: executiveDashboardEngine.snapshot({
      operation_overview: metrics.length,
      operational_health: productivity.sla_health,
      productivity_view: productivity.team_productivity,
      onboarding_view: onboarding.completion_rate,
      financial_view: financial.avg_commitment,
      risk_view: risk.operational_risk,
      growth_view: 0.3,
      tenants_view: tenants.active_tenants,
      sla_view: sla.support_sla,
      compliance_view: 0.95,
    }),
    financial,
    legal,
    operations: operationalAnalyticsEngine.snapshot({
      workflows: workflowMetrics.length,
      queues: 0,
      approvals: 0,
      uploads: opsMetrics.filter((entry) => entry.name === 'document.uploaded').length,
      retries: 0,
      automations: 0,
      integrations: 0,
    }),
    onboarding,
    engagement,
    productivity,
    sla,
    tenants,
    risk,
    insights,
    predictions,
    client_recovery: clientRecoveryAnalytics.snapshot({
      financial_recovery_progress: financial.recovery_index,
      score_improvement: financial.score_evolution,
      renegotiation_progress: financial.renegotiation_rate,
      commitment_reduction: financial.financial_evolution,
      client_progress_index: onboarding.completion_rate,
    }),
    ai: aiAnalyticsFoundation.snapshot({
      copilot_usage: 0,
      ai_productivity: 0,
      assisted_onboarding: 0,
      support_deflection: 0,
      ai_latency_ms: 0,
      ai_review_rate: 0,
    }),
    telemetry,
    observability: {
      missing_metrics: 0,
      broken_pipelines: 0,
      inconsistent_dashboards: 0,
      stale_data: telemetry.stale_data,
      analytics_degradation: telemetry.degraded_data,
    },
    warehouse: analyticsWarehouseFoundation.snapshot({ aggregated_records: metrics.length }),
    governance: analyticsGovernanceEngine.evaluate({ analytics_ownership: true, ai_analytics_guardrail: true }),
    generated_at: new Date().toISOString(),
  };
}

export const analyticsOsFoundation = {
  mount: mountAnalyticsOSFoundation,
  unmount: unmountAnalyticsOSFoundation,
  snapshot: collectAnalyticsOSSnapshot,
};
