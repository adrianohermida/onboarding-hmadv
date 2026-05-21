const MAX_WORKER_EVENTS = 5000;

export class WorkerOrchestrationEngine {
  constructor() {
    this._items = [];
  }

  register(payload = {}) {
    const item = {
      worker_id: payload.worker_id || `wrk_${Date.now()}`,
      tenant_id: payload.tenant_id || 'hmadv',
      workload: payload.workload || 'automation',
      status: payload.status || 'online',
      retries: Number(payload.retries) || 0,
      isolated: payload.isolated !== false,
      trace_id: payload.trace_id || null,
      timestamp: new Date().toISOString(),
    };

    this._items.unshift(item);
    if (this._items.length > MAX_WORKER_EVENTS) this._items.length = MAX_WORKER_EVENTS;
    return item;
  }

  list(tenant_id = null) {
    if (!tenant_id) return [...this._items];
    return this._items.filter((entry) => entry.tenant_id === tenant_id);
  }

  snapshot(tenant_id = null) {
    const list = this.list(tenant_id);
    return {
      total: list.length,
      online: list.filter((entry) => entry.status === 'online').length,
      degraded: list.filter((entry) => entry.status === 'degraded').length,
      failed: list.filter((entry) => entry.status === 'failed').length,
      retries: list.reduce((sum, entry) => sum + entry.retries, 0),
      isolated: list.filter((entry) => entry.isolated).length,
      list,
    };
  }
}

export const workerOrchestrationEngine = new WorkerOrchestrationEngine();
