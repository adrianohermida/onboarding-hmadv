const MAX_EVENTS = 6000;

export class FinancialTimelineEngine {
  constructor() {
    this._events = [];
  }

  add(payload = {}) {
    const event = {
      event_id: payload.event_id || `fte_${Date.now()}`,
      type: payload.type || 'financial.event',
      tenant_id: payload.tenant_id || 'hmadv',
      actor_id: payload.actor_id || 'system',
      score_impact: Number(payload.score_impact) || 0,
      details: payload.details || {},
      timestamp: new Date().toISOString(),
    };
    this._events.unshift(event);
    if (this._events.length > MAX_EVENTS) this._events.length = MAX_EVENTS;
    return event;
  }

  list(tenant_id = null) {
    if (!tenant_id) return [...this._events];
    return this._events.filter((item) => item.tenant_id === tenant_id);
  }
}

export const financialTimelineEngine = new FinancialTimelineEngine();
