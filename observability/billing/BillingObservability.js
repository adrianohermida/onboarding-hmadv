const MAX_BILLING_ITEMS = 600;

export class BillingObservability {
  constructor() {
    this._items = [];
  }

  record(payload = {}) {
    const item = {
      tenant_id: payload.tenant_id || 'hmadv',
      quotas: payload.quotas || {},
      limits: payload.limits || {},
      storage: payload.storage || {},
      upload_costs: payload.upload_costs || {},
      feature_usage: payload.feature_usage || {},
      tenant_consumption: payload.tenant_consumption || {},
      timestamp: new Date().toISOString(),
    };
    this._items.unshift(item);
    if (this._items.length > MAX_BILLING_ITEMS) this._items.length = MAX_BILLING_ITEMS;
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

export const billingObservability = new BillingObservability();
