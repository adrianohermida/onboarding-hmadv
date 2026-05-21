export function normalizeWorkspaceCommandPayload(payload = {}) {
  return {
    command_id: payload.command_id || null,
    tenant_id: payload.tenant_id || 'hmadv',
    key: payload.key || 'workspace.open',
    category: payload.category || 'navigation',
    target: payload.target || null,
    source: payload.source || 'unknown',
    trace_id: payload.trace_id || null,
  };
}
