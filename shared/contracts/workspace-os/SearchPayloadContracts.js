export function normalizeWorkspaceSearchPayload(payload = {}) {
  return {
    tenant_id: payload.tenant_id || 'hmadv',
    search_id: payload.search_id || null,
    query: payload.query || '',
    entity_type: payload.entity_type || 'module',
    entity_id: payload.entity_id || null,
    title: payload.title || '',
    tags: Array.isArray(payload.tags) ? payload.tags : [],
    href: payload.href || null,
  };
}
