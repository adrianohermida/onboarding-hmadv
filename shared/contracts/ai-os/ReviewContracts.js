export const AI_REVIEW_PAYLOAD_VERSION = '1.0.0';

export function normalizeAiReviewPayload(payload = {}) {
  return {
    review_id: payload.review_id || null,
    tenant_id: payload.tenant_id || 'hmadv',
    actor_id: payload.actor_id || null,
    approval_chain: Array.isArray(payload.approval_chain) ? payload.approval_chain : [],
    ownership: payload.ownership || 'ai_os',
    status: payload.status || 'pending',
    trace_id: payload.trace_id || null,
  };
}
