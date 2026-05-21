const DEFAULT_POLICIES = {
  onboarding: 72,
  review: 48,
  analysis: 48,
  hearing: 120,
  negotiation: 168,
  signature: 72,
  agreement: 96,
};

export class LegalSlaEngine {
  constructor() {
    this._items = [];
  }

  track(payload = {}) {
    const item = {
      sla_id: payload.sla_id || `lsla_${Date.now()}`,
      tenant_id: payload.tenant_id || 'hmadv',
      case_id: payload.case_id || null,
      stage: payload.stage || 'onboarding',
      target_hours: Number(payload.target_hours) || DEFAULT_POLICIES[payload.stage] || 72,
      elapsed_hours: Number(payload.elapsed_hours) || 0,
      status: payload.status || 'on_track',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this._items.unshift(item);
    return item;
  }

  snapshot(tenant_id = null) {
    const list = tenant_id ? this._items.filter((entry) => entry.tenant_id === tenant_id) : this._items;
    const overdue = list.filter((entry) => entry.elapsed_hours > entry.target_hours || entry.status === 'overdue').length;
    return { total: list.length, overdue, policies: { ...DEFAULT_POLICIES }, list: [...list] };
  }
}

export const legalSlaEngine = new LegalSlaEngine();
