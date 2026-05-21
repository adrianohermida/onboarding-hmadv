export function normalizeIntegrationRequest(payload = {}) {
  return {
    provider: String(payload.provider || '').trim(),
    operation: String(payload.operation || '').trim(),
    tenant_id: String(payload.tenant_id || 'hmadv'),
    workflow_id: payload.workflow_id || null,
    trace_id: payload.trace_id || payload.correlation_id || null,
    actor_id: payload.actor_id || null,
    data: payload.data && typeof payload.data === 'object' ? payload.data : {},
    timestamp: payload.timestamp || new Date().toISOString(),
  };
}

export function validateIntegrationRequest(payload = {}) {
  const normalized = normalizeIntegrationRequest(payload);
  const errors = [];
  if (!normalized.provider) errors.push('provider is required');
  if (!normalized.operation) errors.push('operation is required');
  if (!normalized.tenant_id) errors.push('tenant_id is required');
  return { valid: errors.length === 0, errors, payload: normalized };
}
