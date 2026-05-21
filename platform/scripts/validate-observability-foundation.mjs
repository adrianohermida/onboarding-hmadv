import { existsSync } from 'node:fs';

const required = [
  'observability/README.md',
  'observability/ObservabilityFoundation.js',
  'observability/telemetry/TelemetryEngine.js',
  'observability/tracing/TraceContext.js',
  'observability/metrics/MetricsRegistry.js',
  'observability/health/HealthEngine.js',
  'observability/logs/StructuredLogger.js',
  'observability/alerts/AlertEngine.js',
  'observability/runtime/RuntimeIntelligence.js',
  'observability/diagnostics/RuntimeDiagnostics.js',
  'observability/performance/PerformanceIntelligence.js',
  'observability/analytics/BusinessObservability.js',
  'observability/analytics/UxObservability.js',
  'observability/dashboards/OperationalDashboards.js',
  'observability/incidents/IncidentCenter.js',
  'observability/workflows/WorkflowObservability.js',
  'observability/workflows/WorkflowCatalog.js',
  'observability/tenants/TenantObservability.js',
  'observability/modules/ModuleObservability.js',
  'observability/integrations/IntegrationObservability.js',
  'observability/security/SecurityObservability.js',
  'observability/billing/BillingObservability.js',
  'observability/storage/StorageObservability.js',
  'observability/ai/AiObservabilityFoundation.js',
  'shared/contracts/observability/ObservabilityContracts.js',
  'shared/contracts/observability/MetricsContracts.js',
  'shared/contracts/observability/TraceContracts.js',
  'shared/contracts/observability/LogContracts.js',
  'shared/contracts/observability/AlertContracts.js',
  'governance/observability/logging-standards.md',
  'governance/observability/tracing-standards.md',
  'governance/observability/telemetry-standards.md',
  'governance/observability/alerting-standards.md',
  'governance/observability/tenant-observability-standards.md',
  'governance/observability/ai-observability-governance.md',
  'governance/observability/module-observability-requirements.md',
  'docs/observability/README.md',
  'docs/observability/telemetry.md',
  'docs/observability/tracing.md',
  'docs/observability/metrics.md',
  'docs/observability/dashboards.md',
  'docs/observability/incidents.md',
  'docs/observability/health.md',
  'docs/observability/alerts.md',
  'admin/observability/index.html',
  'admin/observability/tenant.html',
];

const missing = required.filter((item) => !existsSync(item));
if (missing.length) {
  console.error('validate:observability failed. Missing files:');
  missing.forEach((item) => console.error(`- ${item}`));
  process.exit(1);
}

console.log('validate:observability passed');
