export const ALERT_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

export function normalizeAlertPayload(payload = {}) {
  return {
    code: String(payload.code || '').trim(),
    title: String(payload.title || '').trim(),
    description: String(payload.description || '').trim(),
    severity: payload.severity || ALERT_SEVERITY.MEDIUM,
    source: payload.source || 'runtime',
    tenant_id: payload.tenant_id || 'hmadv',
    trace_id: payload.trace_id || null,
    workflow_id: payload.workflow_id || null,
    status: payload.status || 'open',
    triggered_at: payload.triggered_at || new Date().toISOString(),
    metadata: payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : {},
  };
}

export function validateAlertPayload(payload = {}) {
  const normalized = normalizeAlertPayload(payload);
  const errors = [];

  if (!normalized.code) errors.push('alert.code is required');
  if (!normalized.title) errors.push('alert.title is required');
  if (!Object.values(ALERT_SEVERITY).includes(normalized.severity)) {
    errors.push(`invalid alert severity: ${normalized.severity}`);
  }

  return { valid: errors.length === 0, errors, payload: normalized };
}
