import { bus } from '../modules/events/EventBus.js';
import { telemetryEngine } from './telemetry/TelemetryEngine.js';
import { healthEngine } from './health/HealthEngine.js';
import { runtimeIntelligence } from './runtime/RuntimeIntelligence.js';
import { runtimeDiagnostics } from './diagnostics/RuntimeDiagnostics.js';
import { performanceIntelligence } from './performance/PerformanceIntelligence.js';
import { businessObservability } from './analytics/BusinessObservability.js';
import { uxObservability } from './analytics/UxObservability.js';
import { workflowObservability } from './workflows/WorkflowObservability.js';
import { tenantObservability } from './tenants/TenantObservability.js';
import { moduleObservability } from './modules/ModuleObservability.js';
import { integrationObservability } from './integrations/IntegrationObservability.js';
import { securityObservability } from './security/SecurityObservability.js';
import { billingObservability } from './billing/BillingObservability.js';
import { storageObservability } from './storage/StorageObservability.js';
import { aiObservabilityFoundation } from './ai/AiObservabilityFoundation.js';
import { alertEngine } from './alerts/AlertEngine.js';
import { incidentCenter } from './incidents/IncidentCenter.js';

let mounted = false;
let unsubscribers = [];

export function mountObservabilityFoundation() {
  if (mounted) return;
  mounted = true;

  healthEngine.setComponentHealth('shell', 'healthy');
  healthEngine.setComponentHealth('modules', 'healthy');
  healthEngine.setComponentHealth('auth', 'healthy');
  healthEngine.setComponentHealth('supabase', 'healthy');
  healthEngine.setComponentHealth('integrations', 'healthy');

  runtimeIntelligence.captureMemory();

  unsubscribers = [
    bus.on('event:*', (_payload, envelope) => {
      telemetryEngine.trackWorkflowTiming(envelope?.event || 'event.unknown', 1, {
        tenant_id: envelope?.tenant_id,
        trace_id: envelope?.trace_id || envelope?.correlation_id || null,
      });
      moduleObservability.record(envelope?.source_module || 'event-bus', {
        event_throughput: 1,
      });
    }),
    bus.on('auth.error', (_payload, envelope) => {
      healthEngine.setComponentHealth('auth', 'degraded', 'auth.error emitted');
      securityObservability.track('token.failure', { tenant_id: envelope?.tenant_id });
    }),
    bus.on('upload.failed', (payload, envelope) => {
      healthEngine.setComponentHealth('uploads', 'degraded', 'upload.failed emitted');
      telemetryEngine.trackUploadTiming(payload?.ms || 0, { tenant_id: envelope?.tenant_id });
      storageObservability.record({
        tenant_id: envelope?.tenant_id,
        upload_failures: 1,
      });
      uxObservability.track('ux.loading_frustration', { tenant_id: envelope?.tenant_id, source: 'upload.failed' });
      alertEngine.raise({
        code: 'upload.failure',
        title: 'Upload failure detected',
        severity: 'high',
        source: 'uploads',
        tenant_id: envelope?.tenant_id,
      });
    }),
    bus.on('onboarding.completed', (_payload, envelope) => {
      businessObservability.track('onboarding.completion', { tenant_id: envelope?.tenant_id });
      tenantObservability.record(envelope?.tenant_id, { health: 'healthy', activity: { onboarding: 'completed' } });
    }),
    bus.on('onboarding.abandoned', (_payload, envelope) => {
      businessObservability.track('onboarding.abandonment', { tenant_id: envelope?.tenant_id });
      uxObservability.track('onboarding.abandonment', { tenant_id: envelope?.tenant_id });
    }),
    bus.on('workflow.failed', (payload, envelope) => {
      workflowObservability.fail(payload?.workflow_id, payload?.error || 'workflow.failed');
      alertEngine.raise({
        code: 'workflow.failure',
        title: 'Workflow failure detected',
        severity: 'high',
        source: 'workflows',
        tenant_id: envelope?.tenant_id,
      });
    }),
    bus.on('quota.exceeded', (_payload, envelope) => {
      billingObservability.record({ tenant_id: envelope?.tenant_id, quotas: { exceeded: true } });
      alertEngine.raise({
        code: 'tenant.degradation',
        title: 'Tenant quota exceeded',
        severity: 'medium',
        source: 'billing',
        tenant_id: envelope?.tenant_id,
      });
    }),
    bus.on('ai.workflow.started', (payload, envelope) => {
      aiObservabilityFoundation.track({
        tenant_id: envelope?.tenant_id,
        ai_workflow: payload?.workflow || 'unknown',
      });
    }),
  ];
}

export function unmountObservabilityFoundation() {
  unsubscribers.forEach((off) => {
    try { off(); } catch (_) {}
  });
  unsubscribers = [];
  mounted = false;
}

export function collectOperationalSnapshot() {
  const workflow = workflowObservability.snapshot();
  const latency = performanceIntelligence.snapshot();
  const security = securityObservability.snapshot();
  const health = healthEngine.snapshot();

  alertEngine.evaluateMandatorySignals({
    workflow,
    latency: { p95_ms: latency.p95_api_latency_ms || 0 },
    security,
  });

  const diagnostics = runtimeDiagnostics.run();
  if (!diagnostics.healthy) {
    incidentCenter.open({
      title: 'Runtime diagnostics findings',
      severity: 'medium',
      owner: 'platform',
      detail: JSON.stringify(diagnostics.findings),
    });
  }

  return {
    health,
    diagnostics,
    workflow,
    latency,
    security,
    ux: uxObservability.snapshot(),
    storage: storageObservability.snapshot(),
    ai: aiObservabilityFoundation.snapshot(),
    alerts: alertEngine.list('open'),
  };
}

export const observabilityFoundation = {
  mount: mountObservabilityFoundation,
  unmount: unmountObservabilityFoundation,
  collectOperationalSnapshot,
  telemetryEngine,
  healthEngine,
  runtimeIntelligence,
  runtimeDiagnostics,
  performanceIntelligence,
  businessObservability,
  uxObservability,
  workflowObservability,
  tenantObservability,
  moduleObservability,
  integrationObservability,
  securityObservability,
  billingObservability,
  storageObservability,
  aiObservabilityFoundation,
  alertEngine,
  incidentCenter,
};
