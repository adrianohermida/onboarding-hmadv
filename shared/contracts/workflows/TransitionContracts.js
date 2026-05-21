export function normalizeTransitionPayload(payload = {}) {
  return {
    from: String(payload.from || '').trim(),
    to: String(payload.to || '').trim(),
    workflow: String(payload.workflow || '').trim(),
    workflow_id: payload.workflow_id || null,
    tenant_id: payload.tenant_id || 'hmadv',
    actor: payload.actor || 'system',
    trace_id: payload.trace_id || null,
    timestamp: payload.timestamp || new Date().toISOString(),
  };
}
