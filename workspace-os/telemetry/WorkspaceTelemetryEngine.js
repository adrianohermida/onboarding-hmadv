const MAX_TELEMETRY = 10000;

class WorkspaceTelemetryEngine {
  constructor() {
    this._items = [];
  }

  track(payload = {}) {
    const item = {
      telemetry_id: payload.telemetry_id || `wtele_${Date.now()}`,
      tenant_id: payload.tenant_id || 'hmadv',
      category: payload.category || 'workspace',
      name: payload.name || 'workspace.event',
      value: Number(payload.value) || 1,
      failed: payload.failed === true,
      degraded: payload.degraded === true,
      trace_id: payload.trace_id || null,
      timestamp: new Date().toISOString(),
    };
    this._items.unshift(item);
    if (this._items.length > MAX_TELEMETRY) this._items.length = MAX_TELEMETRY;
    return item;
  }

  snapshot(tenant_id = 'hmadv') {
    const list = this._items.filter((entry) => entry.tenant_id === tenant_id);
    return {
      total: list.length,
      navigation: list.filter((entry) => entry.category === 'navigation').length,
      search: list.filter((entry) => entry.category === 'search').length,
      quick_actions: list.filter((entry) => entry.category === 'quick-action').length,
      copilot_usage: list.filter((entry) => entry.category === 'copilot').length,
      workspace_switching: list.filter((entry) => entry.name === 'workspace.switch').length,
      tab_usage: list.filter((entry) => entry.name === 'workspace.tab').length,
      failed: list.filter((entry) => entry.failed).length,
      degraded: list.filter((entry) => entry.degraded).length,
      list,
    };
  }
}

export const workspaceTelemetryEngine = new WorkspaceTelemetryEngine();
