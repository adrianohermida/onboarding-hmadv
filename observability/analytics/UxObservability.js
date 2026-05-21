const MAX_UX_EVENTS = 800;

export class UxObservability {
  constructor() {
    this._events = [];
  }

  track(name, payload = {}) {
    const event = {
      name,
      payload,
      timestamp: new Date().toISOString(),
    };
    this._events.unshift(event);
    if (this._events.length > MAX_UX_EVENTS) this._events.length = MAX_UX_EVENTS;
    return event;
  }

  snapshot() {
    const count = (name) => this._events.filter((item) => item.name === name).length;
    return {
      onboarding_abandonment: count('onboarding.abandonment'),
      rage_clicks: count('ux.rage_click'),
      loading_frustration: count('ux.loading_frustration'),
      modal_failures: count('ux.modal_failure'),
      navigation_confusion: count('ux.navigation_confusion'),
      total: this._events.length,
    };
  }
}

export const uxObservability = new UxObservability();
