export const LEGAL_CASE_PAYLOAD_VERSION = '1.0.0';

export function normalizeCasePayload(payload = {}) {
  return {
    case_id: payload.case_id || null,
    tenant_id: payload.tenant_id || 'hmadv',
    client_id: payload.client_id || null,
    lawyer_id: payload.lawyer_id || null,
    operator_id: payload.operator_id || null,
    status: payload.status || 'lead',
    workflow: payload.workflow || 'superendividamento.lifecycle',
    risk_score: Number(payload.risk_score) || 0,
    urgency_score: Number(payload.urgency_score) || 0,
    trace_id: payload.trace_id || null,
  };
}
