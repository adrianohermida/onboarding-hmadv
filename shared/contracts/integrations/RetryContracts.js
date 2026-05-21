export function normalizeRetryPayload(payload = {}) {
  return {
    provider: String(payload.provider || '').trim(),
    operation: String(payload.operation || '').trim(),
    attempt: Number(payload.attempt) || 0,
    max_retries: Number(payload.max_retries) || 3,
    reason: payload.reason ? String(payload.reason) : null,
    tenant_id: String(payload.tenant_id || 'hmadv'),
    workflow_id: payload.workflow_id || null,
    trace_id: payload.trace_id || null,
    timestamp: payload.timestamp || new Date().toISOString(),
  };
}
