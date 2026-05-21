const MAX_AUDIT = 20000;

export class AuditabilityEngine {
  constructor() {
    this._items = [];
  }

  record(payload = {}) {
    const item = {
      audit_id: payload.audit_id || `adt_${Date.now()}`,
      actor: payload.actor || 'system',
      tenant_id: payload.tenant_id || 'hmadv',
      action: payload.action || 'unknown_action',
      resource: payload.resource || 'unknown_resource',
      resource_id: payload.resource_id || null,
      before: payload.before || null,
      after: payload.after || null,
      workflow: payload.workflow || null,
      trace_id: payload.trace_id || null,
      timestamp: new Date().toISOString(),
    };

    this._items.unshift(item);
    if (this._items.length > MAX_AUDIT) this._items.length = MAX_AUDIT;
    return item;
  }

  list(tenant_id = null) {
    if (!tenant_id) return [...this._items];
    return this._items.filter((entry) => entry.tenant_id === tenant_id);
  }
}

export const auditabilityEngine = new AuditabilityEngine();
