const MAX_REVIEWS = 8000;

export class HumanReviewFoundation {
  constructor() {
    this._items = [];
  }

  request(payload = {}) {
    const item = {
      review_id: payload.review_id || `ai_rev_${Date.now()}`,
      tenant_id: payload.tenant_id || 'hmadv',
      actor_id: payload.actor_id || 'system',
      approval_chain: payload.approval_chain || ['advogado_responsavel'],
      ownership: payload.ownership || 'legal_ops',
      status: payload.status || 'pending',
      audit_trail: payload.audit_trail || [],
      timestamp: new Date().toISOString(),
    };
    this._items.unshift(item);
    if (this._items.length > MAX_REVIEWS) this._items.length = MAX_REVIEWS;
    return item;
  }

  list(tenant_id = null) {
    if (!tenant_id) return [...this._items];
    return this._items.filter((entry) => entry.tenant_id === tenant_id);
  }
}

export const humanReviewFoundation = new HumanReviewFoundation();
