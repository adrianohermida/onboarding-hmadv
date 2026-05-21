const MAX_LINEAGE = 12000;

export class DataLineageFoundation {
  constructor() {
    this._items = [];
  }

  track(payload = {}) {
    const item = {
      lineage_id: payload.lineage_id || `lin_${Date.now()}`,
      tenant_id: payload.tenant_id || 'hmadv',
      origin: payload.origin || 'portal',
      transformation: payload.transformation || 'none',
      integration: payload.integration || null,
      workflow: payload.workflow || null,
      ai_flow: payload.ai_flow || null,
      export_target: payload.export_target || null,
      trace_id: payload.trace_id || null,
      timestamp: new Date().toISOString(),
    };

    this._items.unshift(item);
    if (this._items.length > MAX_LINEAGE) this._items.length = MAX_LINEAGE;
    return item;
  }

  list(tenant_id = null) {
    if (!tenant_id) return [...this._items];
    return this._items.filter((entry) => entry.tenant_id === tenant_id);
  }
}

export const dataLineageFoundation = new DataLineageFoundation();
