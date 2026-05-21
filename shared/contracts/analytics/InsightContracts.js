export const ANALYTICS_INSIGHT_PAYLOAD_VERSION = '1.0.0';

export function normalizeInsightPayload(payload = {}) {
  return {
    tenant_id: payload.tenant_id || 'hmadv',
    operational_insights: payload.operational_insights || [],
    financial_insights: payload.financial_insights || [],
    onboarding_insights: payload.onboarding_insights || [],
    productivity_insights: payload.productivity_insights || [],
    bottleneck_insights: payload.bottleneck_insights || [],
    trace_id: payload.trace_id || null,
    version: payload.version || ANALYTICS_INSIGHT_PAYLOAD_VERSION,
  };
}
