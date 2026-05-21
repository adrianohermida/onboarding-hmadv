import { existsSync } from 'node:fs';

const required = [
  'analytics-os/README.md',
  'analytics-os/AnalyticsDomainModel.js',
  'analytics-os/AnalyticsOSFoundation.js',
  'analytics-os/ShellAnalyticsVisibility.js',
  'analytics-os/pipelines/AnalyticsPipelineEngine.js',
  'analytics-os/metrics/EnterpriseMetricsEngine.js',
  'analytics-os/dashboards/DashboardRegistry.js',
  'analytics-os/financial/FinancialAnalyticsEngine.js',
  'analytics-os/financial/ClientRecoveryAnalytics.js',
  'analytics-os/legal/LegalAnalyticsEngine.js',
  'analytics-os/operations/OperationalAnalyticsEngine.js',
  'analytics-os/onboarding/OnboardingAnalyticsEngine.js',
  'analytics-os/engagement/EngagementAnalyticsEngine.js',
  'analytics-os/productivity/ProductivityIntelligenceEngine.js',
  'analytics-os/sla/SlaAnalyticsEngine.js',
  'analytics-os/tenants/TenantAnalyticsEngine.js',
  'analytics-os/executive/ExecutiveDashboardEngine.js',
  'analytics-os/risk/RiskAnalyticsEngine.js',
  'analytics-os/predictions/PredictiveFoundation.js',
  'analytics-os/insights/DecisionIntelligenceFoundation.js',
  'analytics-os/kpis/KpiFoundation.js',
  'analytics-os/warehouse/AnalyticsWarehouseFoundation.js',
  'analytics-os/telemetry/AnalyticsTelemetry.js',
  'analytics-os/governance/AnalyticsGovernanceEngine.js',
  'analytics-os/ai/AiAnalyticsFoundation.js',
  'analytics-os/docs/analytics-os-foundation.md',
  'analytics-os/governance/analytics-os-governance.md',
  'shared/contracts/analytics/AnalyticsContracts.js',
  'shared/contracts/analytics/MetricsContracts.js',
  'shared/contracts/analytics/KpiContracts.js',
  'shared/contracts/analytics/PredictionContracts.js',
  'shared/contracts/analytics/InsightContracts.js',
  'docs/analytics/README.md',
  'docs/analytics/kpis.md',
  'docs/analytics/executive-dashboards.md',
  'docs/analytics/risk-analytics.md',
  'docs/analytics/predictive-models.md',
  'docs/analytics/telemetry.md',
  'docs/analytics/governance.md',
  'docs/analytics/ai-analytics.md',
  'governance/analytics/module-requirements.md',
  'governance/analytics/kpi-standards.md',
  'governance/analytics/dashboard-standards.md',
  'governance/analytics/telemetry-standards.md',
  'governance/analytics/prediction-standards.md',
  'governance/analytics/ai-analytics-standards.md',
  'pages/analytics.html',
  'admin/executive/index.html',
];

const missing = required.filter((item) => !existsSync(item));
if (missing.length) {
  console.error('validate:analytics-os failed. Missing files:');
  missing.forEach((item) => console.error(`- ${item}`));
  process.exit(1);
}

console.log('validate:analytics-os passed');
