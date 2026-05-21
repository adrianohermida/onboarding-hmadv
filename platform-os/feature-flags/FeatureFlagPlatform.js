const MAX_FEATURE_FLAGS = 1000;

export class FeatureFlagPlatform {
  constructor() {
    this._items = [];
  }

  register(payload = {}) {
    const item = {
      flag_key: payload.flag_key || `flag_${Date.now()}`,
      tenant_id: payload.tenant_id || 'hmadv',
      rollout_type: payload.rollout_type || 'tenant',
      enabled: payload.enabled === true,
      scope: payload.scope || 'platform',
      trace_id: payload.trace_id || null,
      timestamp: new Date().toISOString(),
    };
    this._items.unshift(item);
    if (this._items.length > MAX_FEATURE_FLAGS) this._items.length = MAX_FEATURE_FLAGS;
    return item;
  }

  list(tenant_id = null) {
    if (!tenant_id) return [...this._items];
    return this._items.filter((entry) => entry.tenant_id === tenant_id);
  }
}

export const featureFlagPlatform = new FeatureFlagPlatform();
