export function normalizeSyncPayload(payload = {}) {
  return {
    entity: String(payload.entity || '').trim(),
    direction: payload.direction || 'provider_to_portal',
    provider: String(payload.provider || '').trim(),
    tenant_id: String(payload.tenant_id || 'hmadv'),
    workflow_id: payload.workflow_id || null,
    data: payload.data && typeof payload.data === 'object' ? payload.data : {},
    timestamp: payload.timestamp || new Date().toISOString(),
  };
}
