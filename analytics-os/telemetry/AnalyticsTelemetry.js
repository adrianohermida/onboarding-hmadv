const MAX_TELEMETRY = 20000;

export class AnalyticsTelemetry {
  constructor() {
    this._items = [];
  }

  track(payload = {}) {
    const item = {
      telemetry_id: payload.telemetry_id || `atl_${Date.now()}`,
      tenant_id: payload.tenant_id || 'hmadv',
      category: payload.category || 'metric',
      name: payload.name || 'analytics.event',
      value: Number(payload.value) || 0,
      stale: payload.stale === true,
      degraded: payload.degraded === true,
      trace_id: payload.trace_id || null,
      timestamp: new Date().toISOString(),
    };

    this._items.unshift(item);
    if (this._items.length > MAX_TELEMETRY) this._items.length = MAX_TELEMETRY;
    return item;
  }

  snapshot(tenant_id = null) {
    const list = tenant_id ? this._items.filter((entry) => entry.tenant_id === tenant_id) : this._items;
    return {
      total: list.length,
      metrics: list.filter((entry) => entry.category === 'metric').length,
      dashboards: list.filter((entry) => entry.category === 'dashboard').length,
      kpis: list.filter((entry) => entry.category === 'kpi').length,
      insights: list.filter((entry) => entry.category === 'insight').length,
      stale_data: list.filter((entry) => entry.stale).length,
      degraded_data: list.filter((entry) => entry.degraded).length,
      list: [...list],
    };
  }
}

export const analyticsTelemetry = new AnalyticsTelemetry();
