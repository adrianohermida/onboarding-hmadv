export const UI_COMPONENT_PAYLOAD_VERSION = '1.0.0';

export function normalizeUiComponentPayload(payload = {}) {
  return {
    component_id: payload.component_id || null,
    tenant_id: payload.tenant_id || 'hmadv',
    component_type: payload.component_type || 'card',
    variant: payload.variant || 'default',
    state: payload.state || 'ready',
    trace_id: payload.trace_id || null,
    version: payload.version || UI_COMPONENT_PAYLOAD_VERSION,
  };
}
