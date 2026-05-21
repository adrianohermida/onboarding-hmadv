const MAX_QUEUE_ITEMS = 5000;

export class QueuePlatformEngine {
  constructor() {
    this._items = [];
  }

  enqueue(payload = {}) {
    const item = {
      queue_id: payload.queue_id || `q_${Date.now()}`,
      tenant_id: payload.tenant_id || 'hmadv',
      workload: payload.workload || 'workflow',
      priority: payload.priority || 'normal',
      retries: Number(payload.retries) || 0,
      dead_letter: payload.dead_letter === true,
      throttled: payload.throttled === true,
      status: payload.status || 'queued',
      trace_id: payload.trace_id || null,
      timestamp: new Date().toISOString(),
    };

    this._items.unshift(item);
    if (this._items.length > MAX_QUEUE_ITEMS) this._items.length = MAX_QUEUE_ITEMS;
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
      queued: list.filter((entry) => entry.status === 'queued').length,
      processing: list.filter((entry) => entry.status === 'processing').length,
      failed: list.filter((entry) => entry.status === 'failed').length,
      dead_letter: list.filter((entry) => entry.dead_letter).length,
      throttled: list.filter((entry) => entry.throttled).length,
      retries: list.reduce((sum, entry) => sum + entry.retries, 0),
      list,
    };
  }
}

export const queuePlatformEngine = new QueuePlatformEngine();
