export function normalizeWorkspaceActivityPayload(payload = {}) {
  return {
    activity_id: payload.activity_id || null,
    tenant_id: payload.tenant_id || 'hmadv',
    type: payload.type || 'navigation',
    title: payload.title || 'Atividade operacional',
    entity_type: payload.entity_type || null,
    entity_id: payload.entity_id || null,
    trace_id: payload.trace_id || null,
  };
}
