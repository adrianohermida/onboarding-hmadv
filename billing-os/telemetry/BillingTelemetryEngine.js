const MAX_BILLING_TELEMETRY = 8000;

class BillingTelemetryEngine {
  constructor() {
    this._items = [];
  }

  track(payload = {}) {
    const item = {
      telemetry_id: payload.telemetry_id || `bt_${Date.now()}`,
      tenant_id: payload.tenant_id || 'hmadv',
      category: payload.category || 'billing',
      name: payload.name || 'billing.event',
      value: Number(payload.value) || 1,
      failed: payload.failed === true,
      degraded: payload.degraded === true,
      trace_id: payload.trace_id || null,
      timestamp: new Date().toISOString(),
    };
    this._items.unshift(item);
    if (this._items.length > MAX_BILLING_TELEMETRY) this._items.length = MAX_BILLING_TELEMETRY;
    return item;
  }

  snapshot(tenant_id = 'hmadv') {
    const list = this._items.filter((entry) => entry.tenant_id === tenant_id);
    return {
      total: list.length,
      subscriptions: list.filter((entry) => entry.category === 'subscription').length,
      invoices: list.filter((entry) => entry.category === 'invoice').length,
      payments: list.filter((entry) => entry.category === 'payment').length,
      quotas: list.filter((entry) => entry.category === 'quota').length,
      usage: list.filter((entry) => entry.category === 'usage').length,
      upgrades: list.filter((entry) => entry.name === 'subscription.upgraded').length,
      downgrades: list.filter((entry) => entry.name === 'subscription.downgraded').length,
      failed: list.filter((entry) => entry.failed).length,
      degraded: list.filter((entry) => entry.degraded).length,
      list,
    };
  }
}

export const billingTelemetryEngine = new BillingTelemetryEngine();
