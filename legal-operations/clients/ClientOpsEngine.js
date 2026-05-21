const MAX_CLIENTS = 4000;

export class ClientOpsEngine {
  constructor() {
    this._items = [];
  }

  register(payload = {}) {
    const item = {
      client_id: payload.client_id || `client_${Date.now()}`,
      tenant_id: payload.tenant_id || 'hmadv',
      name: payload.name || 'Cliente',
      contact: payload.contact || {},
      onboarding_state: payload.onboarding_state || 'not_started',
      active_case_id: payload.active_case_id || null,
      financial_score: Number(payload.financial_score) || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this._items.unshift(item);
    if (this._items.length > MAX_CLIENTS) this._items.length = MAX_CLIENTS;
    return item;
  }

  list(tenant_id = null) {
    if (!tenant_id) return [...this._items];
    return this._items.filter((entry) => entry.tenant_id === tenant_id);
  }
}

export const clientOpsEngine = new ClientOpsEngine();
