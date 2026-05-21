export const LEGAL_SLA_PAYLOAD_VERSION = '1.0.0';

export function normalizeSlaPayload(payload = {}) {
  return {
    sla_id: payload.sla_id || null,
    tenant_id: payload.tenant_id || 'hmadv',
    case_id: payload.case_id || null,
    stage: payload.stage || 'onboarding',
    target_hours: Number(payload.target_hours) || 72,
    elapsed_hours: Number(payload.elapsed_hours) || 0,
    status: payload.status || 'on_track',
    trace_id: payload.trace_id || null,
  };
}
