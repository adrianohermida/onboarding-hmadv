const MAX_METRICS = 20000;

export class EnterpriseMetricsEngine {
  constructor() {
    this._items = [];
  }

  emit(payload = {}) {
    const item = {
      metric_id: payload.metric_id || `met_${Date.now()}`,
      tenant_id: payload.tenant_id || 'hmadv',
      domain: payload.domain || 'operations',
      name: payload.name || 'metric.unknown',
      value: Number(payload.value) || 0,
      tags: payload.tags || {},
      trace_id: payload.trace_id || null,
      timestamp: new Date().toISOString(),
    };
    this._items.unshift(item);
    if (this._items.length > MAX_METRICS) this._items.length = MAX_METRICS;
    return item;
  }

  list(tenant_id = null) {
    if (!tenant_id) return [...this._items];
    return this._items.filter((entry) => entry.tenant_id === tenant_id);
  }
}

export const enterpriseMetricsEngine = new EnterpriseMetricsEngine();
