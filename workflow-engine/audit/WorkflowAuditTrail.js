const MAX_AUDIT = 2000;

export class WorkflowAuditTrail {
  constructor() {
    this._items = [];
  }

  append(payload = {}) {
    const item = {
      workflow: payload.workflow || 'unknown',
      workflow_id: payload.workflow_id || null,
      actor: payload.actor || 'system',
      tenant_id: payload.tenant_id || 'hmadv',
      transition: payload.transition || null,
      approval: payload.approval || null,
      escalation: payload.escalation || null,
      retries: Number(payload.retries) || 0,
      trace_id: payload.trace_id || null,
      timestamp: new Date().toISOString(),
      details: payload.details || {},
    };

    this._items.unshift(item);
    if (this._items.length > MAX_AUDIT) this._items.length = MAX_AUDIT;
    return item;
  }

  list() {
    return [...this._items];
  }
}

export const workflowAuditTrail = new WorkflowAuditTrail();
