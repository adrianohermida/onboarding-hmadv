const MAX_INCIDENTS = 8000;

export class IncidentFoundation {
  constructor() {
    this._items = [];
  }

  register(payload = {}) {
    const item = {
      incident_id: payload.incident_id || `inc_${Date.now()}`,
      tenant_id: payload.tenant_id || 'hmadv',
      type: payload.type || 'security_incident',
      severity: payload.severity || 'medium',
      status: payload.status || 'open',
      description: payload.description || '',
      trace_id: payload.trace_id || null,
      timestamp: new Date().toISOString(),
    };

    this._items.unshift(item);
    if (this._items.length > MAX_INCIDENTS) this._items.length = MAX_INCIDENTS;
    return item;
  }

  list(tenant_id = null) {
    if (!tenant_id) return [...this._items];
    return this._items.filter((entry) => entry.tenant_id === tenant_id);
  }
}

export const incidentFoundation = new IncidentFoundation();
