export class NegotiationEngine {
  constructor() {
    this._items = [];
  }

  register(payload = {}) {
    const item = {
      negotiation_id: payload.negotiation_id || `nego_${Date.now()}`,
      tenant_id: payload.tenant_id || 'hmadv',
      case_id: payload.case_id || null,
      creditor: payload.creditor || 'unknown',
      proposal: payload.proposal || {},
      counterproposal: payload.counterproposal || {},
      discount: Number(payload.discount) || 0,
      installments: Number(payload.installments) || 0,
      status: payload.status || 'open',
      rejection_reason: payload.rejection_reason || null,
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

export const negotiationEngine = new NegotiationEngine();
