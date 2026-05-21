const MAX_QUEUE = 2000;

export class IntegrationQueue {
  constructor() {
    this._items = [];
  }

  enqueue(type, payload = {}) {
    const item = {
      id: `iq_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`,
      type,
      payload,
      queued_at: new Date().toISOString(),
    };
    this._items.push(item);
    if (this._items.length > MAX_QUEUE) this._items.shift();
    return item;
  }

  dequeue() {
    return this._items.shift() || null;
  }

  depth() {
    return this._items.length;
  }

  peek(limit = 20) {
    return this._items.slice(0, Math.max(1, limit));
  }
}

export const integrationQueue = new IntegrationQueue();
