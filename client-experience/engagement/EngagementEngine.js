const MAX_ENGAGEMENT_SIGNALS = 8000;

export class EngagementEngine {
  constructor() {
    this._items = [];
  }

  track(payload = {}) {
    const item = {
      engagement_id: payload.engagement_id || `cxeng_${Date.now()}`,
      tenant_id: payload.tenant_id || 'hmadv',
      client_id: payload.client_id || null,
      case_id: payload.case_id || null,
      type: payload.type || 'portal_access',
      value: Number(payload.value) || 1,
      metadata: payload.metadata || {},
      timestamp: new Date().toISOString(),
    };

    this._items.unshift(item);
    if (this._items.length > MAX_ENGAGEMENT_SIGNALS) this._items.length = MAX_ENGAGEMENT_SIGNALS;
    return item;
  }

  list(tenant_id = null) {
    if (!tenant_id) return [...this._items];
    return this._items.filter((entry) => entry.tenant_id === tenant_id);
  }
}

export const engagementEngine = new EngagementEngine();
