export function buildSemanticRetrievalPlan(payload = {}) {
  return {
    tenant_id: payload.tenant_id || 'hmadv',
    corpus: payload.corpus || 'legal_documents',
    embeddings_provider: payload.embeddings_provider || 'future',
    retrieval_mode: payload.retrieval_mode || 'semantic_future',
    status: 'planned',
    created_at: new Date().toISOString(),
  };
}
