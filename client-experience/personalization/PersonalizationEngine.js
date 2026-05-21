const MAX_PROFILES = 4000;

export class PersonalizationEngine {
  constructor() {
    this._items = [];
  }

  upsert(payload = {}) {
    const key = `${payload.tenant_id || 'hmadv'}:${payload.client_id || 'anonymous'}`;
    const existing = this._items.find((entry) => entry.key === key);

    const next = {
      key,
      tenant_id: payload.tenant_id || 'hmadv',
      client_id: payload.client_id || 'anonymous',
      preferred_tone: payload.preferred_tone || 'acolhedor',
      preferred_channel: payload.preferred_channel || 'email',
      content_focus: payload.content_focus || 'orientacao_pratica',
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      Object.assign(existing, next);
      return existing;
    }

    this._items.unshift(next);
    if (this._items.length > MAX_PROFILES) this._items.length = MAX_PROFILES;
    return next;
  }

  list(tenant_id = null) {
    if (!tenant_id) return [...this._items];
    return this._items.filter((entry) => entry.tenant_id === tenant_id);
  }
}

export const personalizationEngine = new PersonalizationEngine();
