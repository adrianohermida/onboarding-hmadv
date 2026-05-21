export function normalizeWorkflowPayload(payload = {}) {
  return {
    workflow: String(payload.workflow || '').trim(),
    workflow_id: payload.workflow_id || null,
    case_id: payload.case_id || null,
    tenant_id: String(payload.tenant_id || 'hmadv'),
    actor: payload.actor || 'system',
    trace_id: payload.trace_id || payload.correlation_id || null,
    data: payload.data && typeof payload.data === 'object' ? payload.data : {},
    timestamp: payload.timestamp || new Date().toISOString(),
  };
}

export function validateWorkflowPayload(payload = {}) {
  const normalized = normalizeWorkflowPayload(payload);
  const errors = [];
  if (!normalized.workflow) errors.push('workflow is required');
  if (!normalized.tenant_id) errors.push('tenant_id is required');
  return { valid: errors.length === 0, errors, payload: normalized };
}
