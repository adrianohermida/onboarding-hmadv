export const PLATFORM_QUEUE_PAYLOAD_VERSION = '1.0.0';

export function normalizeQueuePayload(payload = {}) {
  return {
    queue_id: payload.queue_id || null,
    tenant_id: payload.tenant_id || 'hmadv',
    workload: payload.workload || 'workflow',
    priority: payload.priority || 'normal',
    retries: Number(payload.retries) || 0,
    dead_letter: payload.dead_letter === true,
    throttled: payload.throttled === true,
    status: payload.status || 'queued',
    trace_id: payload.trace_id || null,
    version: payload.version || PLATFORM_QUEUE_PAYLOAD_VERSION,
  };
}
