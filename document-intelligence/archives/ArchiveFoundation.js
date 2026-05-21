const MAX_ARCHIVED = 2000;

export class ArchiveFoundation {
  constructor() {
    this._items = [];
  }

  archive(payload = {}) {
    const item = {
      document_id: payload.document_id || null,
      tenant_id: payload.tenant_id || 'hmadv',
      owner_id: payload.owner_id || 'system',
      reason: payload.reason || 'retention_policy',
      archived_at: new Date().toISOString(),
    };
    this._items.unshift(item);
    if (this._items.length > MAX_ARCHIVED) this._items.length = MAX_ARCHIVED;
    return item;
  }

  list(tenant_id = null) {
    if (!tenant_id) return [...this._items];
    return this._items.filter((item) => item.tenant_id === tenant_id);
  }
}

export const archiveFoundation = new ArchiveFoundation();
