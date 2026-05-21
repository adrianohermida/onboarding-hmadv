export const PLATFORM_SCALING_PAYLOAD_VERSION = '1.0.0';

export function normalizeScalingPayload(payload = {}) {
  return {
    tenant_id: payload.tenant_id || 'hmadv',
    active_workers: Number(payload.active_workers) || 0,
    queue_depth: Number(payload.queue_depth) || 0,
    throughput: Number(payload.throughput) || 0,
    async_workloads_ready: payload.async_workloads_ready !== false,
    trace_id: payload.trace_id || null,
    version: payload.version || PLATFORM_SCALING_PAYLOAD_VERSION,
  };
}
