export const LEGAL_TASK_PAYLOAD_VERSION = '1.0.0';

export function normalizeTaskPayload(payload = {}) {
  return {
    task_id: payload.task_id || null,
    tenant_id: payload.tenant_id || 'hmadv',
    case_id: payload.case_id || null,
    type: payload.type || 'onboarding_review',
    status: payload.status || 'open',
    owner_id: payload.owner_id || null,
    due_at: payload.due_at || null,
    trace_id: payload.trace_id || null,
  };
}
