export const COMPLIANCE_PRIVACY_PAYLOAD_VERSION = '1.0.0';

export function normalizePrivacyPayload(payload = {}) {
  return {
    tenant_id: payload.tenant_id || 'hmadv',
    privacy_by_default: payload.privacy_by_default !== false,
    minimization_enabled: payload.minimization_enabled !== false,
    tenant_isolation: payload.tenant_isolation !== false,
    secure_access: payload.secure_access !== false,
    auditability: payload.auditability !== false,
    trace_id: payload.trace_id || null,
  };
}
