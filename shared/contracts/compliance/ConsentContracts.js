export const COMPLIANCE_CONSENT_PAYLOAD_VERSION = '1.0.0';

export function normalizeConsentPayload(payload = {}) {
  return {
    consent_id: payload.consent_id || null,
    tenant_id: payload.tenant_id || 'hmadv',
    actor_id: payload.actor_id || null,
    origin: payload.origin || 'onboarding',
    purpose: payload.purpose || 'tratamento_dados_juridicos',
    consent_type: payload.consent_type || 'lgpd',
    version: payload.version || '1.0.0',
    accepted: payload.accepted !== false,
    revoked: payload.revoked === true,
    trace_id: payload.trace_id || null,
  };
}
