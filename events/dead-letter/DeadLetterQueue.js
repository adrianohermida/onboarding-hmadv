export class DeadLetterQueue {
  constructor(maxSize = 500) {
    this._maxSize = maxSize;
    this._items = [];
  }

  push(entry) {
    this._items.unshift({ ...entry, queued_at: new Date().toISOString() });
    if (this._items.length > this._maxSize) {
      this._items.length = this._maxSize;
    }
  }

  list() {
    return [...this._items];
  }
}

export const deadLetterQueue = new DeadLetterQueue();
