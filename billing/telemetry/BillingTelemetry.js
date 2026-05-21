const MAX_ITEMS = 500;

export class BillingTelemetry {
  constructor() {
    this._items = [];
  }

  record(type, data = {}) {
    this._items.unshift({ type, data, ts: new Date().toISOString() });
    if (this._items.length > MAX_ITEMS) this._items.length = MAX_ITEMS;
  }

  list() {
    return [...this._items];
  }
}

export const billingTelemetry = new BillingTelemetry();
