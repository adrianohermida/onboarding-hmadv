export class InMemoryEventQueue {
  constructor() {
    this._items = [];
  }

  enqueue(envelope) {
    this._items.push({ envelope, queued_at: Date.now() });
  }

  dequeue() {
    return this._items.shift() || null;
  }

  size() {
    return this._items.length;
  }
}

export const eventQueue = new InMemoryEventQueue();
