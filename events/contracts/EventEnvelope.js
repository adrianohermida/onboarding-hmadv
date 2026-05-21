export function generateId(prefix = 'evt') {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`;
}

export function createEventEnvelope(eventName, payload = {}, meta = {}) {
  return {
    event: String(eventName || '').trim(),
    version: String(meta.version || '1.0.0'),
    tenant_id: String(meta.tenant_id || 'hmadv'),
    actor_id: meta.actor_id || null,
    user_id: meta.user_id || null,
    entity_id: meta.entity_id || null,
    correlation_id: String(meta.correlation_id || generateId('corr')),
    request_id: String(meta.request_id || generateId('req')),
    workflow_id: meta.workflow_id || null,
    timestamp: meta.timestamp || new Date().toISOString(),
    payload: payload && typeof payload === 'object' ? payload : { value: payload },
  };
}
