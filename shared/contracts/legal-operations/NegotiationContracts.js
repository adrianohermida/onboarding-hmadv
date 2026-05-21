export const LEGAL_NEGOTIATION_PAYLOAD_VERSION = '1.0.0';

export function normalizeNegotiationPayload(payload = {}) {
  return {
    negotiation_id: payload.negotiation_id || null,
    tenant_id: payload.tenant_id || 'hmadv',
    case_id: payload.case_id || null,
    creditor: payload.creditor || 'unknown',
    proposal: payload.proposal || {},
    counterproposal: payload.counterproposal || {},
    discount: Number(payload.discount) || 0,
    installments: Number(payload.installments) || 0,
    status: payload.status || 'open',
    trace_id: payload.trace_id || null,
  };
}
