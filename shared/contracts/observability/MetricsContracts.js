const DEFAULT_UNIT = 'count';

export function normalizeMetricPayload(payload = {}) {
  return {
    name: String(payload.name || '').trim(),
    value: Number.isFinite(payload.value) ? payload.value : 0,
    unit: String(payload.unit || DEFAULT_UNIT),
    type: payload.type || 'gauge',
    tags: payload.tags && typeof payload.tags === 'object' ? payload.tags : {},
    tenant_id: payload.tenant_id || 'hmadv',
    module: payload.module || 'unknown',
    trace_id: payload.trace_id || null,
    timestamp: payload.timestamp || new Date().toISOString(),
  };
}

export function validateMetricPayload(payload = {}) {
  const normalized = normalizeMetricPayload(payload);
  const errors = [];

  if (!normalized.name) errors.push('metric.name is required');
  if (!Number.isFinite(normalized.value)) errors.push('metric.value must be finite');
  if (!normalized.unit) errors.push('metric.unit is required');

  return { valid: errors.length === 0, errors, payload: normalized };
}
