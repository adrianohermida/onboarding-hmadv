const MAX_EVENTS = 1000;

export class BusinessObservability {
  constructor() {
    this._events = [];
  }

  track(name, payload = {}) {
    const event = {
      name,
      payload,
      tenant_id: payload.tenant_id || 'hmadv',
      timestamp: new Date().toISOString(),
    };
    this._events.unshift(event);
    if (this._events.length > MAX_EVENTS) this._events.length = MAX_EVENTS;
    return event;
  }

  snapshot() {
    const counters = this._events.reduce((acc, item) => {
      acc[item.name] = (acc[item.name] || 0) + 1;
      return acc;
    }, {});

    return {
      counters,
      total: this._events.length,
      tracked: [
        'onboarding.completion',
        'onboarding.abandonment',
        'document.rejection',
        'signature.completion',
        'debt.update',
        'plan.generation',
        'user.engagement',
      ],
    };
  }
}

export const businessObservability = new BusinessObservability();
