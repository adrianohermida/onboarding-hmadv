export function normalizeWebhookPayload(payload = {}) {
  return {
    provider: String(payload.provider || '').trim(),
    event: String(payload.event || '').trim(),
    tenant_id: String(payload.tenant_id || 'hmadv'),
    signature: payload.signature || null,
    timestamp: payload.timestamp || new Date().toISOString(),
    request_id: payload.request_id || null,
    correlation_id: payload.correlation_id || null,
    body: payload.body && typeof payload.body === 'object' ? payload.body : {},
  };
}

export function validateWebhookPayload(payload = {}) {
  const normalized = normalizeWebhookPayload(payload);
  const errors = [];
  if (!normalized.provider) errors.push('provider is required');
  if (!normalized.event) errors.push('event is required');
  if (!normalized.tenant_id) errors.push('tenant_id is required');
  return { valid: errors.length === 0, errors, payload: normalized };
}
