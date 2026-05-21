const MAX_NOTIFICATIONS = 8000;

export class SmartNotificationEngine {
  constructor() {
    this._items = [];
  }

  push(payload = {}) {
    const item = {
      notification_id: payload.notification_id || `cxnot_${Date.now()}`,
      tenant_id: payload.tenant_id || 'hmadv',
      client_id: payload.client_id || null,
      category: payload.category || 'onboarding',
      message: payload.message || 'Seu progresso foi atualizado com sucesso.',
      tone: payload.tone || 'positive',
      anxiety_safe: payload.anxiety_safe !== false,
      status: payload.status || 'unread',
      timestamp: new Date().toISOString(),
    };

    this._items.unshift(item);
    if (this._items.length > MAX_NOTIFICATIONS) this._items.length = MAX_NOTIFICATIONS;
    return item;
  }

  list(tenant_id = null) {
    if (!tenant_id) return [...this._items];
    return this._items.filter((entry) => entry.tenant_id === tenant_id);
  }
}

export const smartNotificationEngine = new SmartNotificationEngine();
