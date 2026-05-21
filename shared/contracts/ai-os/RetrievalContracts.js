export const AI_RETRIEVAL_PAYLOAD_VERSION = '1.0.0';

export function normalizeAiRetrievalPayload(payload = {}) {
  return {
    retrieval_id: payload.retrieval_id || null,
    tenant_id: payload.tenant_id || 'hmadv',
    source: payload.source || 'knowledge',
    query: payload.query || '',
    trace_id: payload.trace_id || null,
  };
}
