export const LOG_SEVERITY = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  CRITICAL: 'critical',
};

export function normalizeLogPayload(payload = {}) {
  return {
    severity: payload.severity || LOG_SEVERITY.INFO,
    message: String(payload.message || '').trim(),
    source_module: payload.source_module || 'unknown',
    tenant_id: payload.tenant_id || 'hmadv',
    correlation_id: payload.correlation_id || null,
    request_id: payload.request_id || null,
    workflow_id: payload.workflow_id || null,
    trace_id: payload.trace_id || null,
    data: payload.data && typeof payload.data === 'object' ? payload.data : {},
    timestamp: payload.timestamp || new Date().toISOString(),
  };
}

export function validateLogPayload(payload = {}) {
  const normalized = normalizeLogPayload(payload);
  const errors = [];

  if (!normalized.message) errors.push('log.message is required');
  if (!Object.values(LOG_SEVERITY).includes(normalized.severity)) {
    errors.push(`invalid severity: ${normalized.severity}`);
  }

  return { valid: errors.length === 0, errors, payload: normalized };
}
