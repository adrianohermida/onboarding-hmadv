function randomId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`;
}

export function createTracePayload(meta = {}) {
  return {
    trace_id: String(meta.trace_id || randomId('trace')),
    span_id: String(meta.span_id || randomId('span')),
    parent_span_id: meta.parent_span_id || null,
    correlation_id: String(meta.correlation_id || randomId('corr')),
    request_id: String(meta.request_id || randomId('req')),
    workflow_id: meta.workflow_id || null,
    actor_id: meta.actor_id || null,
    tenant_id: String(meta.tenant_id || 'hmadv'),
    source_module: meta.source_module || 'unknown',
    started_at: meta.started_at || new Date().toISOString(),
  };
}

export function validateTracePayload(meta = {}) {
  const payload = createTracePayload(meta);
  const errors = [];

  if (!payload.trace_id) errors.push('trace_id is required');
  if (!payload.span_id) errors.push('span_id is required');
  if (!payload.correlation_id) errors.push('correlation_id is required');
  if (!payload.request_id) errors.push('request_id is required');

  return { valid: errors.length === 0, errors, payload };
}
