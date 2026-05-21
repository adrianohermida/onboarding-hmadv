export const UI_CHART_PAYLOAD_VERSION = '1.0.0';

export function normalizeUiChartPayload(payload = {}) {
  return {
    chart_id: payload.chart_id || null,
    tenant_id: payload.tenant_id || 'hmadv',
    chart_type: payload.chart_type || 'line',
    datapoints: Number(payload.datapoints) || 0,
    responsive: payload.responsive !== false,
    trace_id: payload.trace_id || null,
    version: payload.version || UI_CHART_PAYLOAD_VERSION,
  };
}
