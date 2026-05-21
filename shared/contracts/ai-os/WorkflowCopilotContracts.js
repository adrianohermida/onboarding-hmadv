export const AI_WORKFLOW_PAYLOAD_VERSION = '1.0.0';

export function normalizeAiWorkflowPayload(payload = {}) {
  return {
    workflow_id: payload.workflow_id || null,
    tenant_id: payload.tenant_id || 'hmadv',
    suggestions: Array.isArray(payload.suggestions) ? payload.suggestions : [],
    requires_human_review: payload.requires_human_review !== false,
    trace_id: payload.trace_id || null,
  };
}
