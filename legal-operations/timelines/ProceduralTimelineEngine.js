const MAX_EVENTS = 8000;

export class ProceduralTimelineEngine {
  constructor() {
    this._events = [];
  }

  add(payload = {}) {
    const event = {
      event_id: payload.event_id || `lte_${Date.now()}`,
      tenant_id: payload.tenant_id || 'hmadv',
      case_id: payload.case_id || null,
      actor_id: payload.actor_id || 'system',
      type: payload.type || 'legal.event',
      workflow_state: payload.workflow_state || null,
      financial_state: payload.financial_state || null,
      onboarding_state: payload.onboarding_state || null,
      risk_state: payload.risk_state || null,
      details: payload.details || {},
      timestamp: new Date().toISOString(),
    };
    this._events.unshift(event);
    if (this._events.length > MAX_EVENTS) this._events.length = MAX_EVENTS;
    return event;
  }

  list(tenant_id = null) {
    if (!tenant_id) return [...this._events];
    return this._events.filter((entry) => entry.tenant_id === tenant_id);
  }
}

export const proceduralTimelineEngine = new ProceduralTimelineEngine();
