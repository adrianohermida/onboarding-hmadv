const MAX_ACCESS = 20000;

export class AccessGovernanceEngine {
  constructor() {
    this._items = [];
  }

  record(payload = {}) {
    const item = {
      access_id: payload.access_id || `acs_${Date.now()}`,
      tenant_id: payload.tenant_id || 'hmadv',
      actor_id: payload.actor_id || 'system',
      role: payload.role || 'support',
      resource: payload.resource || 'unknown',
      sensitivity: payload.sensitivity || 'INTERNO',
      action: payload.action || 'read',
      suspicious: payload.suspicious === true,
      trace_id: payload.trace_id || null,
      timestamp: new Date().toISOString(),
    };

    this._items.unshift(item);
    if (this._items.length > MAX_ACCESS) this._items.length = MAX_ACCESS;
    return item;
  }

  list(tenant_id = null) {
    if (!tenant_id) return [...this._items];
    return this._items.filter((entry) => entry.tenant_id === tenant_id);
  }
}

export const accessGovernanceEngine = new AccessGovernanceEngine();
