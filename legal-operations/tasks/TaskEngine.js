export class TaskEngine {
  constructor() {
    this._items = [];
  }

  create(payload = {}) {
    const item = {
      task_id: payload.task_id || `task_${Date.now()}`,
      tenant_id: payload.tenant_id || 'hmadv',
      case_id: payload.case_id || null,
      type: payload.type || 'onboarding_review',
      status: payload.status || 'open',
      owner_id: payload.owner_id || null,
      workflow: payload.workflow || 'legal.operations.task',
      due_at: payload.due_at || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this._items.unshift(item);
    return item;
  }

  updateStatus(task_id, status, actor_id = 'system') {
    const item = this._items.find((entry) => entry.task_id === task_id);
    if (!item) return null;
    item.status = status || item.status;
    item.updated_at = new Date().toISOString();
    item.updated_by = actor_id;
    return item;
  }

  list(tenant_id = null) {
    if (!tenant_id) return [...this._items];
    return this._items.filter((entry) => entry.tenant_id === tenant_id);
  }
}

export const taskEngine = new TaskEngine();
