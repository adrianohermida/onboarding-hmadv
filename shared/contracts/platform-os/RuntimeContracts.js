export const PLATFORM_RUNTIME_PAYLOAD_VERSION = '1.0.0';

export function normalizeRuntimePayload(payload = {}) {
  return {
    tenant_id: payload.tenant_id || 'hmadv',
    lifecycle: payload.lifecycle || 'running',
    workers_online: Number(payload.workers_online) || 0,
    queues_online: Number(payload.queues_online) || 0,
    events_processing: Number(payload.events_processing) || 0,
    background_jobs: Number(payload.background_jobs) || 0,
    isolation_enforced: payload.isolation_enforced !== false,
    health: payload.health || 'healthy',
    trace_id: payload.trace_id || null,
    version: payload.version || PLATFORM_RUNTIME_PAYLOAD_VERSION,
  };
}
