import { validateMetricPayload } from '../../shared/contracts/observability/MetricsContracts.js';

const MAX_ITEMS = 1000;

export class MetricsRegistry {
  constructor() {
    this._items = [];
  }

  record(payload = {}) {
    const result = validateMetricPayload(payload);
    if (!result.valid) return { ok: false, errors: result.errors };

    this._items.unshift(result.payload);
    if (this._items.length > MAX_ITEMS) this._items.length = MAX_ITEMS;
    return { ok: true, metric: result.payload };
  }

  snapshot() {
    const counters = this._items.reduce((acc, item) => {
      const key = item.name;
      acc[key] = (acc[key] || 0) + item.value;
      return acc;
    }, {});

    return {
      counters,
      total_metrics: this._items.length,
      latest: this._items[0] || null,
    };
  }

  list() {
    return [...this._items];
  }
}

export const metricsRegistry = new MetricsRegistry();
