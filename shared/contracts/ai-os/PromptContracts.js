export const AI_PROMPT_PAYLOAD_VERSION = '1.0.0';

export function normalizeAiPromptPayload(payload = {}) {
  return {
    prompt_id: payload.prompt_id || null,
    tenant_id: payload.tenant_id || 'hmadv',
    actor_id: payload.actor_id || null,
    prompt: payload.prompt || '',
    scope: payload.scope || 'copilot',
    trace_id: payload.trace_id || null,
  };
}
