export const ANALYTICS_PREDICTION_PAYLOAD_VERSION = '1.0.0';

export function normalizePredictionPayload(payload = {}) {
  return {
    tenant_id: payload.tenant_id || 'hmadv',
    abandonment_forecast: Number(payload.abandonment_forecast) || 0,
    aggravation_forecast: Number(payload.aggravation_forecast) || 0,
    default_forecast: Number(payload.default_forecast) || 0,
    productivity_forecast: Number(payload.productivity_forecast) || 0,
    sla_forecast: Number(payload.sla_forecast) || 0,
    trace_id: payload.trace_id || null,
    version: payload.version || ANALYTICS_PREDICTION_PAYLOAD_VERSION,
  };
}
