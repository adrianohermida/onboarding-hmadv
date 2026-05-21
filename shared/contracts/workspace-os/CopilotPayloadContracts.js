export function normalizeWorkspaceCopilotPayload(payload = {}) {
  return {
    tenant_id: payload.tenant_id || 'hmadv',
    context_type: payload.context_type || 'operational',
    summary: payload.summary || '',
    next_steps: Array.isArray(payload.next_steps) ? payload.next_steps : [],
    pending_items: Array.isArray(payload.pending_items) ? payload.pending_items : [],
    requires_human_review: payload.requires_human_review !== false,
  };
}
