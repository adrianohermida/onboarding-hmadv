export const ANALYTICS_METRICS_PAYLOAD_VERSION = '1.0.0';

export function normalizeMetricPayload(payload = {}) {
  return {
    metric_id: payload.metric_id || null,
    tenant_id: payload.tenant_id || 'hmadv',
    domain: payload.domain || 'operations',
    name: payload.name || 'metric.unknown',
    value: Number(payload.value) || 0,
    tags: payload.tags || {},
    trace_id: payload.trace_id || null,
    version: payload.version || ANALYTICS_METRICS_PAYLOAD_VERSION,
  };
}
