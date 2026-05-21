const MAX_INDEX = 5000;

export class MetadataIndexingFoundation {
  constructor() {
    this._items = [];
  }

  index(payload = {}) {
    const row = {
      document_id: payload.document_id,
      type: payload.type || 'unknown',
      category: payload.category || 'juridico',
      owner_id: payload.owner_id || 'system',
      workflow_status: payload.workflow_status || 'uploaded',
      tenant_id: payload.tenant_id || 'hmadv',
      updated_at: new Date().toISOString(),
    };
    this._items.unshift(row);
    if (this._items.length > MAX_INDEX) this._items.length = MAX_INDEX;
    return row;
  }

  list(tenant_id = null) {
    if (!tenant_id) return [...this._items];
    return this._items.filter((item) => item.tenant_id === tenant_id);
  }
}

export const metadataIndexingFoundation = new MetadataIndexingFoundation();
