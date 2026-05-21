import { bus } from '../modules/events/EventBus.js';
import { platformRuntimeEngine } from './runtime/PlatformRuntimeEngine.js';
import { deploymentFoundation } from './deployments/DeploymentFoundation.js';
import { scalabilityFoundation } from './scaling/ScalabilityFoundation.js';
import { performanceEngineeringEngine } from './performance/PerformanceEngineeringEngine.js';
import { tenantCachingFoundation } from './caching/TenantCachingFoundation.js';
import { edgeRuntimeFoundation } from './edge/EdgeRuntimeFoundation.js';
import { queuePlatformEngine } from './queues/QueuePlatformEngine.js';
import { workerOrchestrationEngine } from './workers/WorkerOrchestrationEngine.js';
import { resilienceEngineeringEngine } from './resilience/ResilienceEngineeringEngine.js';
import { failoverFoundation } from './failover/FailoverFoundation.js';
import { backupFoundation } from './backup/BackupFoundation.js';
import { disasterRecoveryFoundation } from './recovery/DisasterRecoveryFoundation.js';
import { storageGovernanceEngine } from './storage/StorageGovernanceEngine.js';
import { networkFoundation } from './network/NetworkFoundation.js';
import { cdnFoundation } from './cdn/CdnFoundation.js';
import { platformSecurityFoundation } from './security/PlatformSecurityFoundation.js';
import { operationalMonitoringEngine } from './monitoring/OperationalMonitoringEngine.js';
import { platformTelemetry } from './telemetry/PlatformTelemetry.js';
import { featureFlagPlatform } from './feature-flags/FeatureFlagPlatform.js';
import { environmentGovernanceEngine } from './environments/EnvironmentGovernanceEngine.js';
import { tenantIsolationPlatform } from './tenants/TenantIsolationPlatform.js';
import { platformGovernanceEngine } from './governance/PlatformGovernanceEngine.js';
import { platformAnalyticsEngine } from './analytics/PlatformAnalyticsEngine.js';
import { listPlatformOsDomainEntities } from './PlatformOSDomainModel.js';

let mounted = false;
let offs = [];

function trace(category, name, payload = {}, envelope = {}) {
  platformTelemetry.track({
    tenant_id: envelope.tenant_id || payload.tenant_id || 'hmadv',
    category,
    name,
    value: Number(payload.value) || 1,
    degraded: payload.degraded === true,
    failed: payload.failed === true,
    trace_id: envelope.trace_id || envelope.correlation_id || null,
  });
}

export function mountPlatformOSFoundation() {
  if (mounted) return;
  mounted = true;

  platformRuntimeEngine.update({ lifecycle: 'running', health: 'healthy', workers_online: 1, queues_online: 1 });

  offs = [
    bus.on('deployment.completed', (payload, envelope) => {
      deploymentFoundation.register(payload);
      trace('deployment', 'deployment.completed', payload, envelope);
    }),
    bus.on('deployment.failed', (payload, envelope) => {
      deploymentFoundation.register({ ...payload, status: 'failed' });
      trace('deployment', 'deployment.failed', { ...payload, failed: true }, envelope);
    }),
    bus.on('workflow.executed', (payload, envelope) => {
      queuePlatformEngine.enqueue({ tenant_id: payload.tenant_id, workload: 'workflow', status: 'processing', trace_id: envelope.trace_id || envelope.correlation_id || null });
      workerOrchestrationEngine.register({ tenant_id: payload.tenant_id, workload: 'workflow', status: 'online', trace_id: envelope.trace_id || envelope.correlation_id || null });
      trace('runtime', 'workflow.executed', payload, envelope);
    }),
    bus.on('document.uploaded', (payload, envelope) => {
      queuePlatformEngine.enqueue({ tenant_id: payload.tenant_id, workload: 'upload', status: 'queued', trace_id: envelope.trace_id || envelope.correlation_id || null });
      trace('queue', 'document.uploaded', payload, envelope);
    }),
    bus.on('integration.call.completed', (payload, envelope) => {
      workerOrchestrationEngine.register({ tenant_id: payload.tenant_id, workload: 'integration', status: 'online', trace_id: envelope.trace_id || envelope.correlation_id || null });
      trace('worker', 'integration.call.completed', payload, envelope);
    }),
    bus.on('feature.flag.updated', (payload, envelope) => {
      featureFlagPlatform.register(payload);
      trace('runtime', 'feature.flag.updated', payload, envelope);
    }),
  ];
}

export function unmountPlatformOSFoundation() {
  offs.forEach((off) => {
    try { off(); } catch (_) {}
  });
  offs = [];
  mounted = false;
}

export function collectPlatformOSSnapshot(tenant_id = 'hmadv') {
  const deployments = deploymentFoundation.list(tenant_id);
  const queues = queuePlatformEngine.snapshot(tenant_id);
  const workers = workerOrchestrationEngine.snapshot(tenant_id);
  const telemetry = platformTelemetry.snapshot(tenant_id);

  const runtime = platformRuntimeEngine.update({
    lifecycle: 'running',
    workers_online: workers.online,
    queues_online: queues.total > 0 ? 1 : 0,
    events_processing: queues.processing,
    background_jobs: workers.total,
    health: telemetry.failed > 0 ? 'degraded' : 'healthy',
  });

  const scaling = scalabilityFoundation.snapshot({
    active_workers: workers.online,
    queue_depth: queues.queued,
    throughput: workers.total,
  });

  const performance = performanceEngineeringEngine.snapshot({
    bundle_size_kb: 0,
    route_performance_ms: 0,
    hydration_ms: 0,
    upload_performance_ms: 0,
    onboarding_performance_ms: 0,
    workflow_latency_ms: 0,
    ai_latency_ms: 0,
  });

  const resilience = resilienceEngineeringEngine.snapshot({
    retry_events: queues.retries,
    degraded_events: telemetry.degraded,
    isolated_failures: queues.dead_letter,
  });

  return {
    domain_entities: listPlatformOsDomainEntities(),
    runtime,
    deployments: { total: deployments.length, failed: deployments.filter((entry) => entry.status === 'failed').length, list: deployments },
    scaling,
    performance,
    caching: tenantCachingFoundation.snapshot({ cache_hits: 0, cache_misses: 0 }),
    edge: edgeRuntimeFoundation.snapshot({ edge_locations_active: 0 }),
    queues,
    workers,
    resilience,
    failover: failoverFoundation.snapshot({ failover_events: 0 }),
    backup: backupFoundation.snapshot({ last_backup_at: null }),
    recovery: disasterRecoveryFoundation.snapshot({ rto_minutes: 0, rpo_minutes: 0 }),
    storage: storageGovernanceEngine.snapshot({ storage_usage_mb: 0 }),
    network: networkFoundation.snapshot({ latency_ms: 0 }),
    cdn: cdnFoundation.snapshot({ edge_cache_hit_ratio: 0 }),
    security: platformSecurityFoundation.snapshot({ vulnerabilities_open: 0 }),
    environments: environmentGovernanceEngine.snapshot({ enterprise: false }),
    tenants: tenantIsolationPlatform.snapshot({ active_tenants: 1 }),
    monitoring: operationalMonitoringEngine.snapshot({
      deployments: deployments.length,
      queues: queues.total,
      workers: workers.total,
      runtimes: 1,
      storage: 0,
      scaling: scaling.active_workers,
      workflows: queues.list.filter((entry) => entry.workload === 'workflow').length,
      integrations: workers.list.filter((entry) => entry.workload === 'integration').length,
      incidents: telemetry.failed,
    }),
    telemetry,
    analytics: platformAnalyticsEngine.snapshot({
      throughput: workers.total,
      scaling_events: telemetry.scaling,
      tenant_load: 1,
      worker_usage: workers.online,
      deployment_health: deployments.length ? 1 - (deployments.filter((entry) => entry.status === 'failed').length / deployments.length) : 1,
      operational_bottlenecks: queues.dead_letter,
    }),
    governance: platformGovernanceEngine.evaluate({
      observability_required: true,
      tenant_isolation_required: true,
      retries_required: true,
    }),
    observability: {
      degraded_runtime: runtime.health === 'degraded' ? 1 : 0,
      queue_overload: queues.queued > 100 ? 1 : 0,
      deployment_failures: deployments.filter((entry) => entry.status === 'failed').length,
      tenant_degradation: telemetry.degraded,
      upload_degradation: queues.list.filter((entry) => entry.workload === 'upload' && entry.status === 'failed').length,
    },
    generated_at: new Date().toISOString(),
  };
}

export const platformOsFoundation = {
  mount: mountPlatformOSFoundation,
  unmount: unmountPlatformOSFoundation,
  snapshot: collectPlatformOSSnapshot,
};
