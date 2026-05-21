export function normalizeKnowledgeMetadata(payload = {}) {
  return {
    document_id: payload.document_id || null,
    type: String(payload.type || '').trim().toLowerCase(),
    category: String(payload.category || '').trim().toLowerCase(),
    tenant_id: String(payload.tenant_id || 'hmadv'),
    owner_id: payload.owner_id || 'system',
    lifecycle_state: payload.lifecycle_state || 'uploaded',
    validation_state: payload.validation_state || 'pending',
    retention_policy: payload.retention_policy || 'legal_default_5y',
    tags: Array.isArray(payload.tags) ? payload.tags : [],
    timestamp: payload.timestamp || new Date().toISOString(),
  };
}
