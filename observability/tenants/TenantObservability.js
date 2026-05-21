const MAX_ITEMS = 500;

export class TenantObservability {
  constructor() {
    this._items = [];
  }

  record(tenant_id, payload = {}) {
    const item = {
      tenant_id: tenant_id || 'hmadv',
      usage: payload.usage || {},
      activity: payload.activity || {},
      health: payload.health || 'unknown',
      workflows: payload.workflows || {},
      failures: Number(payload.failures) || 0,
      latency_ms: Number(payload.latency_ms) || 0,
      timestamp: new Date().toISOString(),
    };
    this._items.unshift(item);
    if (this._items.length > MAX_ITEMS) this._items.length = MAX_ITEMS;
    return item;
  }

  snapshot(tenant_id = null) {
    const items = tenant_id ? this._items.filter((item) => item.tenant_id === tenant_id) : this._items;
    return {
      total: items.length,
      degraded: items.filter((item) => item.health === 'degraded').length,
      failed: items.filter((item) => item.failures > 0).length,
      avg_latency_ms: items.length
        ? Math.round(items.reduce((sum, item) => sum + item.latency_ms, 0) / items.length)
        : 0,
      list: [...items],
    };
  }
}

export const tenantObservability = new TenantObservability();
