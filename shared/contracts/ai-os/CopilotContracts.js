export const AI_COPILOT_PAYLOAD_VERSION = '1.0.0';

export function normalizeAiCopilotPayload(payload = {}) {
  return {
    suggestion_id: payload.suggestion_id || null,
    tenant_id: payload.tenant_id || 'hmadv',
    scope: payload.scope || 'workflow',
    text: payload.text || '',
    confidence: Number(payload.confidence) || 0,
    trace_id: payload.trace_id || null,
  };
}
