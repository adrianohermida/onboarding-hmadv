const MAX_TELEMETRY_ITEMS = 10000;

export class PlatformTelemetry {
  constructor() {
    this._items = [];
  }

  track(payload = {}) {
    const item = {
      telemetry_id: payload.telemetry_id || `ptl_${Date.now()}`,
      tenant_id: payload.tenant_id || 'hmadv',
      category: payload.category || 'runtime',
      name: payload.name || 'platform.event',
      value: Number(payload.value) || 1,
      degraded: payload.degraded === true,
      failed: payload.failed === true,
      trace_id: payload.trace_id || null,
      timestamp: new Date().toISOString(),
    };

    this._items.unshift(item);
    if (this._items.length > MAX_TELEMETRY_ITEMS) this._items.length = MAX_TELEMETRY_ITEMS;
    return item;
  }

  snapshot(tenant_id = null) {
    const list = tenant_id ? this._items.filter((entry) => entry.tenant_id === tenant_id) : this._items;
    return {
      total: list.length,
      deployments: list.filter((entry) => entry.category === 'deployment').length,
      runtime: list.filter((entry) => entry.category === 'runtime').length,
      queues: list.filter((entry) => entry.category === 'queue').length,
      workers: list.filter((entry) => entry.category === 'worker').length,
      scaling: list.filter((entry) => entry.category === 'scaling').length,
      performance: list.filter((entry) => entry.category === 'performance').length,
      degraded: list.filter((entry) => entry.degraded).length,
      failed: list.filter((entry) => entry.failed).length,
      list: [...list],
    };
  }
}

export const platformTelemetry = new PlatformTelemetry();
