const MAX_ESCALATIONS = 800;

export class EscalationEngine {
  constructor() {
    this._items = [];
  }

  trigger(payload = {}) {
    const item = {
      escalation_id: payload.escalation_id || `esc_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`,
      type: payload.type || 'sla_overdue',
      level: payload.level || 'manager',
      tenant_id: payload.tenant_id || 'hmadv',
      workflow_id: payload.workflow_id || null,
      reason: payload.reason || 'SLA overdue',
      status: 'open',
      opened_at: new Date().toISOString(),
      resolved_at: null,
    };

    this._items.unshift(item);
    if (this._items.length > MAX_ESCALATIONS) this._items.length = MAX_ESCALATIONS;
    return item;
  }

  resolve(escalation_id) {
    this._items = this._items.map((item) => (
      item.escalation_id === escalation_id
        ? { ...item, status: 'resolved', resolved_at: new Date().toISOString() }
        : item
    ));
  }

  list(status = null) {
    if (!status) return [...this._items];
    return this._items.filter((item) => item.status === status);
  }
}

export const escalationEngine = new EscalationEngine();
