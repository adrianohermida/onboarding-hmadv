export const CLIENT_ONBOARDING_PAYLOAD_VERSION = '1.0.0';

export function normalizeClientOnboardingPayload(payload = {}) {
  return {
    journey_id: payload.journey_id || null,
    tenant_id: payload.tenant_id || 'hmadv',
    client_id: payload.client_id || null,
    stage: payload.stage || 'onboarding',
    status: payload.status || 'active',
    progress_percent: Number(payload.progress_percent) || 0,
    anxiety_safe: payload.anxiety_safe !== false,
    trace_id: payload.trace_id || null,
  };
}
