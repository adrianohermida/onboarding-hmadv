export class AssignmentEngine {
  constructor() {
    this._items = [];
  }

  assign(payload = {}) {
    const item = {
      assignment_id: payload.assignment_id || `assign_${Date.now()}`,
      tenant_id: payload.tenant_id || 'hmadv',
      case_id: payload.case_id || null,
      lawyer_id: payload.lawyer_id || null,
      operator_id: payload.operator_id || null,
      financial_id: payload.financial_id || null,
      support_id: payload.support_id || null,
      supervisor_id: payload.supervisor_id || null,
      ownership: payload.ownership || 'shared',
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

export const assignmentEngine = new AssignmentEngine();
