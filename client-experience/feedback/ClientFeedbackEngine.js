const MAX_FEEDBACK = 4000;

export class ClientFeedbackEngine {
  constructor() {
    this._items = [];
  }

  collect(payload = {}) {
    const item = {
      feedback_id: payload.feedback_id || `cxfbk_${Date.now()}`,
      tenant_id: payload.tenant_id || 'hmadv',
      client_id: payload.client_id || null,
      area: payload.area || 'onboarding',
      score: Number(payload.score) || 0,
      comment: payload.comment || '',
      timestamp: new Date().toISOString(),
    };

    this._items.unshift(item);
    if (this._items.length > MAX_FEEDBACK) this._items.length = MAX_FEEDBACK;
    return item;
  }

  list(tenant_id = null) {
    if (!tenant_id) return [...this._items];
    return this._items.filter((entry) => entry.tenant_id === tenant_id);
  }
}

export const clientFeedbackEngine = new ClientFeedbackEngine();
