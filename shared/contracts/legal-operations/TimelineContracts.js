export const LEGAL_TIMELINE_PAYLOAD_VERSION = '1.0.0';

export function normalizeTimelinePayload(payload = {}) {
  return {
    event_id: payload.event_id || null,
    tenant_id: payload.tenant_id || 'hmadv',
    case_id: payload.case_id || null,
    actor_id: payload.actor_id || 'system',
    type: payload.type || 'legal.event',
    workflow_state: payload.workflow_state || null,
    financial_state: payload.financial_state || null,
    onboarding_state: payload.onboarding_state || null,
    risk_state: payload.risk_state || null,
    details: payload.details || {},
    trace_id: payload.trace_id || null,
  };
}
