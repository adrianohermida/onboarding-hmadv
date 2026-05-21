import { healthEngine } from '../health/HealthEngine.js';
import { workflowObservability } from '../workflows/WorkflowObservability.js';
import { tenantObservability } from '../tenants/TenantObservability.js';
import { integrationObservability } from '../integrations/IntegrationObservability.js';
import { incidentCenter } from '../incidents/IncidentCenter.js';
import { performanceIntelligence } from '../performance/PerformanceIntelligence.js';
import { securityObservability } from '../security/SecurityObservability.js';
import { billingObservability } from '../billing/BillingObservability.js';

export function buildGlobalDashboard() {
  return {
    runtime_health: healthEngine.snapshot(),
    workflow_health: workflowObservability.snapshot(),
    tenant_health: tenantObservability.snapshot(),
    integrations_health: integrationObservability.snapshot(),
    queue_health: { depth: 0, status: 'stable' },
    incidents: incidentCenter.snapshot(),
    latency: performanceIntelligence.snapshot(),
    generated_at: new Date().toISOString(),
  };
}

export function buildTenantDashboard(tenant_id = 'hmadv') {
  return {
    tenant_id,
    onboarding_health: tenantObservability.snapshot(tenant_id),
    documents_health: tenantObservability.snapshot(tenant_id),
    upload_health: tenantObservability.snapshot(tenant_id),
    notifications_health: tenantObservability.snapshot(tenant_id),
    plans_health: billingObservability.snapshot(tenant_id),
    generated_at: new Date().toISOString(),
  };
}

export function buildAdminDashboard() {
  return {
    global_runtime: buildGlobalDashboard(),
    tenants: tenantObservability.snapshot(),
    workflows: workflowObservability.snapshot(),
    uploads: performanceIntelligence.snapshot(),
    incidents: incidentCenter.snapshot(),
    queues: { depth: 0, status: 'stable' },
    latency: performanceIntelligence.snapshot(),
    security: securityObservability.snapshot(),
    generated_at: new Date().toISOString(),
  };
}
