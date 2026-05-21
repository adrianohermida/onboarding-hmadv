export class AgreementEngine {
  constructor() {
    this._items = [];
  }

  create(payload = {}) {
    const item = {
      agreement_id: payload.agreement_id || `agree_${Date.now()}`,
      tenant_id: payload.tenant_id || 'hmadv',
      case_id: payload.case_id || null,
      negotiation_id: payload.negotiation_id || null,
      status: payload.status || 'pending_signature',
      homologation_state: payload.homologation_state || 'future',
      monitoring_state: payload.monitoring_state || 'active',
      inadimplencia_risk: Number(payload.inadimplencia_risk) || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this._items.unshift(item);
    return item;
  }

  list(tenant_id = null) {
    if (!tenant_id) return [...this._items];
    return this._items.filter((entry) => entry.tenant_id === tenant_id);
  }
}

export const agreementEngine = new AgreementEngine();
