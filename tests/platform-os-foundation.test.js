import { describe, expect, it } from 'vitest';
import { deploymentFoundation } from '../platform-os/deployments/DeploymentFoundation.js';
import { queuePlatformEngine } from '../platform-os/queues/QueuePlatformEngine.js';
import { workerOrchestrationEngine } from '../platform-os/workers/WorkerOrchestrationEngine.js';
import { platformTelemetry } from '../platform-os/telemetry/PlatformTelemetry.js';
import { platformOsFoundation } from '../platform-os/PlatformOSFoundation.js';

describe('platform os foundation', () => {
  it('builds snapshot with runtime, deployments, queues and workers', () => {
    deploymentFoundation.register({ tenant_id: 'tenant-pos', environment: 'staging', status: 'success' });
    queuePlatformEngine.enqueue({ tenant_id: 'tenant-pos', workload: 'workflow', status: 'queued' });
    workerOrchestrationEngine.register({ tenant_id: 'tenant-pos', workload: 'workflow', status: 'online' });
    platformTelemetry.track({ tenant_id: 'tenant-pos', category: 'runtime', name: 'platform.runtime', value: 1 });

    const snapshot = platformOsFoundation.snapshot('tenant-pos');

    expect(snapshot.domain_entities.length).toBeGreaterThan(5);
    expect(snapshot.runtime).toBeTruthy();
    expect(snapshot.deployments.total).toBeGreaterThanOrEqual(1);
    expect(snapshot.queues.total).toBeGreaterThanOrEqual(1);
    expect(snapshot.workers.total).toBeGreaterThanOrEqual(1);
  });

  it('exposes resilience and governance guarantees', () => {
    const snapshot = platformOsFoundation.snapshot('tenant-pos');

    expect(snapshot.resilience.retry_policies_ready).toBe(true);
    expect(snapshot.governance.runtime_standards).toBe(true);
    expect(snapshot.observability).toBeTruthy();
  });
});
