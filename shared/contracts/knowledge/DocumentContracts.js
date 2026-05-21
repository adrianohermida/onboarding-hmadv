export function normalizeKnowledgeDocument(payload = {}) {
  return {
    document_id: payload.document_id || null,
    tenant_id: payload.tenant_id || 'hmadv',
    owner_id: payload.owner_id || 'system',
    workflow_id: payload.workflow_id || null,
    trace_id: payload.trace_id || payload.correlation_id || null,
    status: payload.status || 'uploaded',
    uploaded_at: payload.uploaded_at || new Date().toISOString(),
  };
}
