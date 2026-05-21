const MAX_STORAGE_ITEMS = 600;

export class StorageObservability {
  constructor() {
    this._items = [];
  }

  record(payload = {}) {
    const item = {
      tenant_id: payload.tenant_id || 'hmadv',
      upload_throughput: Number(payload.upload_throughput) || 0,
      upload_failures: Number(payload.upload_failures) || 0,
      storage_growth_mb: Number(payload.storage_growth_mb) || 0,
      storage_quota_mb: Number(payload.storage_quota_mb) || 0,
      signed_url_failures: Number(payload.signed_url_failures) || 0,
      timestamp: new Date().toISOString(),
    };

    this._items.unshift(item);
    if (this._items.length > MAX_STORAGE_ITEMS) this._items.length = MAX_STORAGE_ITEMS;
    return item;
  }

  snapshot(tenant_id = null) {
    const list = tenant_id ? this._items.filter((item) => item.tenant_id === tenant_id) : this._items;
    return {
      total: list.length,
      latest: list[0] || null,
      list: [...list],
    };
  }
}

export const storageObservability = new StorageObservability();
