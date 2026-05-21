export function normalizeEscalationPayload(payload = {}) {
  return {
    escalation_id: payload.escalation_id || null,
    type: payload.type || 'sla_overdue',
    level: payload.level || 'manager',
    workflow_id: payload.workflow_id || null,
    tenant_id: payload.tenant_id || 'hmadv',
    reason: payload.reason || 'sla overdue',
    actor: payload.actor || 'system',
    timestamp: payload.timestamp || new Date().toISOString(),
  };
}
