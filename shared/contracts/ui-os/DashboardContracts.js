export const UI_DASHBOARD_PAYLOAD_VERSION = '1.0.0';

export function normalizeUiDashboardPayload(payload = {}) {
  return {
    dashboard_id: payload.dashboard_id || null,
    tenant_id: payload.tenant_id || 'hmadv',
    layout_mode: payload.layout_mode || 'adaptive-grid',
    widgets: Number(payload.widgets) || 0,
    mobile_ready: payload.mobile_ready !== false,
    trace_id: payload.trace_id || null,
    version: payload.version || UI_DASHBOARD_PAYLOAD_VERSION,
  };
}
