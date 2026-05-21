export class DeadlineEngine {
  constructor() {
    this._items = [];
  }

  register(payload = {}) {
    const item = {
      deadline_id: payload.deadline_id || `ddl_${Date.now()}`,
      tenant_id: payload.tenant_id || 'hmadv',
      case_id: payload.case_id || null,
      category: payload.category || 'task',
      due_at: payload.due_at || null,
      status: payload.status || 'open',
      sla_key: payload.sla_key || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this._items.unshift(item);
    return item;
  }

  list(tenant_id = null) {
    if (!tenant_id) return [...this._items];
    return this._items.filter((entry) => entry.tenant_id === tenant_id);
  }
}

export const deadlineEngine = new DeadlineEngine();
