const MAX_TELEMETRY = 10000;

export class ClientExperienceTelemetry {
  constructor() {
    this._items = [];
  }

  track(payload = {}) {
    const item = {
      telemetry_id: payload.telemetry_id || `cxtele_${Date.now()}`,
      event: payload.event || 'client_experience.event',
      tenant_id: payload.tenant_id || 'hmadv',
      client_id: payload.client_id || null,
      actor_id: payload.actor_id || 'system',
      onboarding_state: payload.onboarding_state || null,
      engagement_state: payload.engagement_state || null,
      vulnerability_state: payload.vulnerability_state || null,
      inputs: payload.inputs || {},
      outputs: payload.outputs || {},
      trace_id: payload.trace_id || payload.correlation_id || null,
      timestamp: new Date().toISOString(),
    };

    this._items.unshift(item);
    if (this._items.length > MAX_TELEMETRY) this._items.length = MAX_TELEMETRY;
    return item;
  }

  snapshot(tenant_id = null) {
    const list = tenant_id
      ? this._items.filter((entry) => entry.tenant_id === tenant_id)
      : this._items;

    return {
      total: list.length,
      onboarding: list.filter((entry) => entry.event.includes('onboarding')).length,
      notifications: list.filter((entry) => entry.event.includes('notification')).length,
      uploads: list.filter((entry) => entry.event.includes('upload')).length,
      progress: list.filter((entry) => entry.event.includes('progress')).length,
      feedbacks: list.filter((entry) => entry.event.includes('feedback')).length,
      list: [...list],
    };
  }
}

export const clientExperienceTelemetry = new ClientExperienceTelemetry();
