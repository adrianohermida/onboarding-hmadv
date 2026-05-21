const MAX_QUEUE = 3000;

export class WorkflowQueue {
  constructor() {
    this._items = [];
  }

  enqueue(type, payload = {}) {
    const item = {
      id: `wq_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`,
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
}

export const workflowQueue = new WorkflowQueue();
