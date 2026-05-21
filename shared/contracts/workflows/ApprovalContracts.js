export function normalizeApprovalPayload(payload = {}) {
  return {
    approval_id: payload.approval_id || null,
    type: payload.type || 'workflow_approval',
    workflow_id: payload.workflow_id || null,
    tenant_id: payload.tenant_id || 'hmadv',
    owner: payload.owner || 'operations',
    status: payload.status || 'pending',
    actor: payload.actor || 'system',
    timestamp: payload.timestamp || new Date().toISOString(),
  };
}
