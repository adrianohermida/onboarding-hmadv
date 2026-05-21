export const CLIENT_FEEDBACK_PAYLOAD_VERSION = '1.0.0';

export function normalizeClientFeedbackPayload(payload = {}) {
  return {
    feedback_id: payload.feedback_id || null,
    tenant_id: payload.tenant_id || 'hmadv',
    client_id: payload.client_id || null,
    area: payload.area || 'plataforma',
    score: Number(payload.score) || 0,
    comment: payload.comment || '',
    trace_id: payload.trace_id || null,
  };
}
