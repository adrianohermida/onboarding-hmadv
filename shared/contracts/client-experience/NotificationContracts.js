export const CLIENT_NOTIFICATION_PAYLOAD_VERSION = '1.0.0';

export function normalizeClientNotificationPayload(payload = {}) {
  return {
    notification_id: payload.notification_id || null,
    tenant_id: payload.tenant_id || 'hmadv',
    client_id: payload.client_id || null,
    category: payload.category || 'onboarding',
    message: payload.message || 'Seu progresso foi atualizado.',
    tone: payload.tone || 'positive',
    anxiety_safe: payload.anxiety_safe !== false,
    trace_id: payload.trace_id || null,
  };
}
