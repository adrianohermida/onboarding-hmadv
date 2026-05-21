export const CLIENT_ENGAGEMENT_PAYLOAD_VERSION = '1.0.0';

export function normalizeClientEngagementPayload(payload = {}) {
  return {
    engagement_id: payload.engagement_id || null,
    tenant_id: payload.tenant_id || 'hmadv',
    client_id: payload.client_id || null,
    case_id: payload.case_id || null,
    type: payload.type || 'portal_access',
    value: Number(payload.value) || 1,
    metadata: payload.metadata || {},
    trace_id: payload.trace_id || null,
  };
}
