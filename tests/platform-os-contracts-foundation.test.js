import { describe, expect, it } from 'vitest';
import { normalizeDeploymentPayload } from '../shared/contracts/platform-os/DeploymentContracts.js';
import { normalizeQueuePayload } from '../shared/contracts/platform-os/QueueContracts.js';
import { normalizeRuntimePayload } from '../shared/contracts/platform-os/RuntimeContracts.js';
import { normalizeScalingPayload } from '../shared/contracts/platform-os/ScalingContracts.js';
import { normalizePlatformTelemetryPayload } from '../shared/contracts/platform-os/TelemetryContracts.js';

describe('platform os contracts', () => {
  it('normalizes deployment, queue and runtime payloads', () => {
    const deployment = normalizeDeploymentPayload({ tenant_id: 'tenant-pos', environment: 'production' });
    const queue = normalizeQueuePayload({ tenant_id: 'tenant-pos', workload: 'analytics' });
    const runtime = normalizeRuntimePayload({ tenant_id: 'tenant-pos', lifecycle: 'running' });

    expect(deployment.tenant_id).toBe('tenant-pos');
    expect(queue.workload).toBe('analytics');
    expect(runtime.lifecycle).toBe('running');
  });

  it('normalizes scaling and telemetry payloads', () => {
    const scaling = normalizeScalingPayload({ active_workers: 8, queue_depth: 12, throughput: 30 });
    const telemetry = normalizePlatformTelemetryPayload({ category: 'queue', name: 'queue.depth', value: 12 });

    expect(scaling.active_workers).toBe(8);
    expect(scaling.queue_depth).toBe(12);
    expect(telemetry.category).toBe('queue');
  });
});
