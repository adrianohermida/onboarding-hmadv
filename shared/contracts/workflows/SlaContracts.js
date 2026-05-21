export function normalizeSlaPayload(payload = {}) {
  return {
    workflow: payload.workflow || 'unknown',
    stage: payload.stage || 'unknown',
    tenant_id: payload.tenant_id || 'hmadv',
    target_ms: Number(payload.target_ms) || 0,
    elapsed_ms: Number(payload.elapsed_ms) || 0,
    deadline_at: payload.deadline_at || null,
    overdue: !!payload.overdue,
    trace_id: payload.trace_id || null,
    timestamp: payload.timestamp || new Date().toISOString(),
  };
}
