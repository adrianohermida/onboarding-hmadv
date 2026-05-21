const MAX_ITEMS = 1200;

export class WorkflowTelemetry {
  constructor() {
    this._items = [];
  }

  record(payload = {}) {
    const item = {
      workflow: payload.workflow || 'unknown',
      latency_ms: Number(payload.latency_ms) || 0,
      failures: Number(payload.failures) || 0,
      retries: Number(payload.retries) || 0,
      escalations: Number(payload.escalations) || 0,
      stuck: !!payload.stuck,
      throughput: Number(payload.throughput) || 0,
      tenant_id: payload.tenant_id || 'hmadv',
      trace_id: payload.trace_id || null,
      timestamp: new Date().toISOString(),
    };

    this._items.unshift(item);
    if (this._items.length > MAX_ITEMS) this._items.length = MAX_ITEMS;
    return item;
  }

  snapshot() {
    return {
      total: this._items.length,
      failures: this._items.reduce((sum, item) => sum + item.failures, 0),
      retries: this._items.reduce((sum, item) => sum + item.retries, 0),
      escalations: this._items.reduce((sum, item) => sum + item.escalations, 0),
      stuck: this._items.filter((item) => item.stuck).length,
      throughput: this._items.reduce((sum, item) => sum + item.throughput, 0),
      list: [...this._items],
    };
  }
}

export const workflowTelemetry = new WorkflowTelemetry();
