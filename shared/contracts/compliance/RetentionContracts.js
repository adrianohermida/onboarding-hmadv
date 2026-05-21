export const COMPLIANCE_RETENTION_PAYLOAD_VERSION = '1.0.0';

export function normalizeRetentionPayload(payload = {}) {
  return {
    tenant_id: payload.tenant_id || 'hmadv',
    retention_days: Number(payload.retention_days) || 0,
    legal_hold: payload.legal_hold === true,
    archival_ready: payload.archival_ready !== false,
    future_deletion_ready: payload.future_deletion_ready !== false,
    trace_id: payload.trace_id || null,
  };
}
