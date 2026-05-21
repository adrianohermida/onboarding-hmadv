export const COMPLIANCE_AUDIT_PAYLOAD_VERSION = '1.0.0';

export function normalizeAuditPayload(payload = {}) {
  return {
    audit_id: payload.audit_id || null,
    tenant_id: payload.tenant_id || 'hmadv',
    actor: payload.actor || 'system',
    action: payload.action || 'unknown_action',
    resource: payload.resource || 'unknown_resource',
    before: payload.before || null,
    after: payload.after || null,
    workflow: payload.workflow || null,
    trace_id: payload.trace_id || null,
  };
}
