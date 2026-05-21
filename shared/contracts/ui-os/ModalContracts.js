export const UI_MODAL_PAYLOAD_VERSION = '1.0.0';

export function normalizeUiModalPayload(payload = {}) {
  return {
    modal_id: payload.modal_id || null,
    tenant_id: payload.tenant_id || 'hmadv',
    modal_type: payload.modal_type || 'confirmation',
    open: payload.open === true,
    context: payload.context || 'general',
    trace_id: payload.trace_id || null,
    version: payload.version || UI_MODAL_PAYLOAD_VERSION,
  };
}
