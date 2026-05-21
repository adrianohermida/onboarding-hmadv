const MAX_COMMUNICATIONS = 8000;

export class CommunicationOrchestration {
  constructor() {
    this._items = [];
  }

  enqueue(payload = {}) {
    const item = {
      communication_id: payload.communication_id || `cxcom_${Date.now()}`,
      tenant_id: payload.tenant_id || 'hmadv',
      client_id: payload.client_id || null,
      channel: payload.channel || 'email',
      template: payload.template || 'acolhimento_inicial',
      sentiment: payload.sentiment || 'acolhedor',
      status: payload.status || 'queued',
      context: payload.context || {},
      timestamp: new Date().toISOString(),
    };

    this._items.unshift(item);
    if (this._items.length > MAX_COMMUNICATIONS) this._items.length = MAX_COMMUNICATIONS;
    return item;
  }

  list(tenant_id = null) {
    if (!tenant_id) return [...this._items];
    return this._items.filter((entry) => entry.tenant_id === tenant_id);
  }
}

export const communicationOrchestration = new CommunicationOrchestration();
