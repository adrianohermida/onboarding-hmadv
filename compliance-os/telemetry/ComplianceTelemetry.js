const MAX_TELEMETRY = 20000;

export class ComplianceTelemetry {
  constructor() {
    this._items = [];
  }

  track(payload = {}) {
    const item = {
      telemetry_id: payload.telemetry_id || `ctl_${Date.now()}`,
      event: payload.event || 'compliance.event',
      tenant_id: payload.tenant_id || 'hmadv',
      category: payload.category || 'audit',
      severity: payload.severity || 'info',
      violation: payload.violation === true,
      anomaly: payload.anomaly === true,
      trace_id: payload.trace_id || null,
      timestamp: new Date().toISOString(),
    };

    this._items.unshift(item);
    if (this._items.length > MAX_TELEMETRY) this._items.length = MAX_TELEMETRY;
    return item;
  }

  snapshot(tenant_id = null) {
    const list = tenant_id ? this._items.filter((entry) => entry.tenant_id === tenant_id) : this._items;
    return {
      total: list.length,
      consent_events: list.filter((entry) => entry.category === 'consent').length,
      access_events: list.filter((entry) => entry.category === 'access').length,
      audit_events: list.filter((entry) => entry.category === 'audit').length,
      violations: list.filter((entry) => entry.violation).length,
      anomalies: list.filter((entry) => entry.anomaly).length,
      list: [...list],
    };
  }
}

export const complianceTelemetry = new ComplianceTelemetry();
