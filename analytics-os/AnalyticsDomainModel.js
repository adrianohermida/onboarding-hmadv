const ANALYTICS_DOMAIN_ENTITIES = [
  'MetricRecord',
  'KpiSnapshot',
  'FinancialAnalytics',
  'LegalAnalytics',
  'OperationalAnalytics',
  'OnboardingAnalytics',
  'EngagementAnalytics',
  'ProductivityAnalytics',
  'SlaAnalytics',
  'TenantAnalytics',
  'RiskAnalytics',
  'DecisionInsight',
  'PredictiveSignal',
  'ExecutiveDashboard',
  'AnalyticsTelemetry',
  'AnalyticsWarehouseSummary',
];

export function listAnalyticsDomainEntities() {
  return [...ANALYTICS_DOMAIN_ENTITIES];
}

export default ANALYTICS_DOMAIN_ENTITIES;
