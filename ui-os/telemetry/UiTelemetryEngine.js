const MAX_UI_TELEMETRY = 10000;

export class UiTelemetryEngine {
  constructor() {
    this._items = [];
  }

  track(payload = {}) {
    const item = {
      telemetry_id: payload.telemetry_id || `uit_${Date.now()}`,
      tenant_id: payload.tenant_id || 'hmadv',
      category: payload.category || 'interaction',
      name: payload.name || 'ui.event',
      value: Number(payload.value) || 1,
      failed: payload.failed === true,
      degraded: payload.degraded === true,
      trace_id: payload.trace_id || null,
      timestamp: new Date().toISOString(),
    };

    this._items.unshift(item);
    if (this._items.length > MAX_UI_TELEMETRY) this._items.length = MAX_UI_TELEMETRY;
    return item;
  }

  snapshot(tenant_id = null) {
    const list = tenant_id ? this._items.filter((entry) => entry.tenant_id === tenant_id) : this._items;
    return {
      total: list.length,
      interactions: list.filter((entry) => entry.category === 'interaction').length,
      modals: list.filter((entry) => entry.category === 'modal').length,
      mobile: list.filter((entry) => entry.category === 'mobile').length,
      render: list.filter((entry) => entry.category === 'render').length,
      onboarding_friction: list.filter((entry) => entry.name === 'onboarding.friction').length,
      failed: list.filter((entry) => entry.failed).length,
      degraded: list.filter((entry) => entry.degraded).length,
      list,
    };
  }
}

export const uiTelemetryEngine = new UiTelemetryEngine();
