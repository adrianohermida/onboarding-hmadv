const MAX_TELEMETRY = 12000;

export class AiTelemetry {
  constructor() {
    this._items = [];
  }

  track(payload = {}) {
    const item = {
      telemetry_id: payload.telemetry_id || `ai_tel_${Date.now()}`,
      event: payload.event || 'ai.event',
      tenant_id: payload.tenant_id || 'hmadv',
      agent: payload.agent || 'copilot',
      latency_ms: Number(payload.latency_ms) || 0,
      status: payload.status || 'ok',
      retries: Number(payload.retries) || 0,
      escalation: payload.escalation === true,
      human_review: payload.human_review === true,
      trace_id: payload.trace_id || null,
      timestamp: new Date().toISOString(),
    };
    this._items.unshift(item);
    if (this._items.length > MAX_TELEMETRY) this._items.length = MAX_TELEMETRY;
    return item;
  }

  snapshot(tenant_id = null) {
    const list = tenant_id ? this._items.filter((entry) => entry.tenant_id === tenant_id) : this._items;
    return {
      total: list.length,
      failures: list.filter((entry) => entry.status !== 'ok').length,
      retries: list.reduce((acc, entry) => acc + (entry.retries || 0), 0),
      escalations: list.filter((entry) => entry.escalation).length,
      human_review: list.filter((entry) => entry.human_review).length,
      avg_latency_ms: list.length ? Math.round(list.reduce((acc, entry) => acc + (entry.latency_ms || 0), 0) / list.length) : 0,
      list: [...list],
    };
  }
}

export const aiTelemetry = new AiTelemetry();
