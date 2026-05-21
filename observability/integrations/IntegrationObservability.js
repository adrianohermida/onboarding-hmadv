const MAX_INTEGRATION_ITEMS = 600;

export class IntegrationObservability {
  constructor() {
    this._items = [];
  }

  record(integration, payload = {}) {
    const item = {
      integration,
      latency_ms: Number(payload.latency_ms) || 0,
      retries: Number(payload.retries) || 0,
      failures: Number(payload.failures) || 0,
      throughput: Number(payload.throughput) || 0,
      timestamp: new Date().toISOString(),
    };
    this._items.unshift(item);
    if (this._items.length > MAX_INTEGRATION_ITEMS) this._items.length = MAX_INTEGRATION_ITEMS;
    return item;
  }

  snapshot() {
    const grouped = this._items.reduce((acc, item) => {
      if (!acc[item.integration]) acc[item.integration] = { failures: 0, retries: 0, throughput: 0, latency: [] };
      acc[item.integration].failures += item.failures;
      acc[item.integration].retries += item.retries;
      acc[item.integration].throughput += item.throughput;
      acc[item.integration].latency.push(item.latency_ms);
      return acc;
    }, {});

    return {
      integrations: Object.fromEntries(Object.entries(grouped).map(([name, value]) => ([
        name,
        {
          failures: value.failures,
          retries: value.retries,
          throughput: value.throughput,
          avg_latency_ms: value.latency.length
            ? Math.round(value.latency.reduce((sum, ms) => sum + ms, 0) / value.latency.length)
            : 0,
        },
      ]))),
      tracked: ['freshdesk', 'resend', 'autentique', 'future_ocr', 'future_analytics'],
    };
  }
}

export const integrationObservability = new IntegrationObservability();
