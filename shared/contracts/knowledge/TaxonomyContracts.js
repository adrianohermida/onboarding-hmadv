export function normalizeTaxonomyPayload(payload = {}) {
  return {
    type: String(payload.type || '').trim().toLowerCase(),
    category: String(payload.category || '').trim().toLowerCase(),
    tenant_id: payload.tenant_id || 'hmadv',
    actor_id: payload.actor_id || 'system',
    timestamp: payload.timestamp || new Date().toISOString(),
  };
}
