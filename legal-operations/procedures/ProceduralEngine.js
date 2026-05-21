export class ProceduralEngine {
  constructor() {
    this._items = [];
  }

  register(payload = {}) {
    const item = {
      procedure_id: payload.procedure_id || `proc_${Date.now()}`,
      tenant_id: payload.tenant_id || 'hmadv',
      case_id: payload.case_id || null,
      type: payload.type || 'fluxo_cnj',
      status: payload.status || 'pending',
      workflow: payload.workflow || 'legal.operations.procedure',
      steps: Array.isArray(payload.steps) ? payload.steps : [],
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

export const proceduralEngine = new ProceduralEngine();
