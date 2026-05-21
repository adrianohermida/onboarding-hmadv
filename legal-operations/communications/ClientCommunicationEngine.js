export class ClientCommunicationEngine {
  constructor() {
    this._items = [];
  }

  send(payload = {}) {
    const item = {
      communication_id: payload.communication_id || `comm_${Date.now()}`,
      tenant_id: payload.tenant_id || 'hmadv',
      case_id: payload.case_id || null,
      client_id: payload.client_id || null,
      channel: payload.channel || 'email',
      type: payload.type || 'onboarding_reminder',
      status: payload.status || 'sent',
      content: payload.content || '',
      actor_id: payload.actor_id || 'system',
      created_at: new Date().toISOString(),
    };
    this._items.unshift(item);
    return item;
  }

  list(tenant_id = null) {
    if (!tenant_id) return [...this._items];
    return this._items.filter((entry) => entry.tenant_id === tenant_id);
  }
}

export const clientCommunicationEngine = new ClientCommunicationEngine();
