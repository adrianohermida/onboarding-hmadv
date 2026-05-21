export function normalizeKnowledgePayload(payload = {}) {
  return {
    id: payload.id || null,
    domain: payload.domain || 'faq',
    title: payload.title || 'Knowledge entry',
    content_type: payload.content_type || 'article',
    tenant_id: payload.tenant_id || 'hmadv',
    owner_id: payload.owner_id || 'knowledge-team',
    tags: Array.isArray(payload.tags) ? payload.tags : [],
    timestamp: payload.timestamp || new Date().toISOString(),
  };
}
