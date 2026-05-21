export const ANALYTICS_KPI_PAYLOAD_VERSION = '1.0.0';

export function normalizeKpiPayload(payload = {}) {
  return {
    tenant_id: payload.tenant_id || 'hmadv',
    onboarding: payload.onboarding || {},
    financial: payload.financial || {},
    legal: payload.legal || {},
    client: payload.client || {},
    version: payload.version || ANALYTICS_KPI_PAYLOAD_VERSION,
  };
}
