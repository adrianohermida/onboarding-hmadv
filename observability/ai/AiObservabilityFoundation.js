const MAX_AI_ITEMS = 500;

export class AiObservabilityFoundation {
  constructor() {
    this._items = [];
  }

  track(payload = {}) {
    const item = {
      tenant_id: payload.tenant_id || 'hmadv',
      prompt_telemetry: payload.prompt_telemetry || {},
      ai_workflow: payload.ai_workflow || null,
      ai_latency_ms: Number(payload.ai_latency_ms) || 0,
      ai_cost: Number(payload.ai_cost) || 0,
      ai_failure: payload.ai_failure || null,
      timestamp: new Date().toISOString(),
    };
    this._items.unshift(item);
    if (this._items.length > MAX_AI_ITEMS) this._items.length = MAX_AI_ITEMS;
    return item;
  }

  snapshot() {
    return {
      total: this._items.length,
      failed: this._items.filter((item) => !!item.ai_failure).length,
      avg_latency_ms: this._items.length
        ? Math.round(this._items.reduce((sum, item) => sum + item.ai_latency_ms, 0) / this._items.length)
        : 0,
      total_cost: this._items.reduce((sum, item) => sum + item.ai_cost, 0),
      latest: this._items[0] || null,
      mode: 'foundation_only',
    };
  }
}

export const aiObservabilityFoundation = new AiObservabilityFoundation();
