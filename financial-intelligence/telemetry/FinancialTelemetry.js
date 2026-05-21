const MAX_TELEMETRY = 5000;

export class FinancialTelemetry {
  constructor() {
    this._items = [];
  }

  track(payload = {}) {
    const item = {
      event: payload.event || 'financial.updated',
      tenant_id: payload.tenant_id || 'hmadv',
      actor_id: payload.actor_id || 'system',
      workflow_id: payload.workflow_id || null,
      trace_id: payload.trace_id || null,
      inputs: payload.inputs || {},
      outputs: payload.outputs || {},
      score_impact: Number(payload.score_impact) || 0,
      timestamp: new Date().toISOString(),
    };
    this._items.unshift(item);
    if (this._items.length > MAX_TELEMETRY) this._items.length = MAX_TELEMETRY;
    return item;
  }

  snapshot() {
    return {
      total: this._items.length,
      updates: this._items.filter((item) => item.event.includes('updated')).length,
      renegotiations: this._items.filter((item) => item.event.includes('renegotiation')).length,
      payments: this._items.filter((item) => item.event.includes('payment')).length,
      simulations: this._items.filter((item) => item.event.includes('simulation')).length,
      plans: this._items.filter((item) => item.event.includes('plan')).length,
      list: [...this._items],
    };
  }
}

export const financialTelemetry = new FinancialTelemetry();
