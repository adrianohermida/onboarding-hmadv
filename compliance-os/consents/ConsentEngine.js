const MAX_CONSENTS = 10000;

export class ConsentEngine {
  constructor() {
    this._items = [];
  }

  register(payload = {}) {
    const item = {
      consent_id: payload.consent_id || `cns_${Date.now()}`,
      tenant_id: payload.tenant_id || 'hmadv',
      actor_id: payload.actor_id || 'system',
      subject_id: payload.subject_id || null,
      origin: payload.origin || 'onboarding',
      purpose: payload.purpose || 'tratamento_dados_juridicos',
      consent_type: payload.consent_type || 'lgpd',
      version: payload.version || '1.0.0',
      accepted: payload.accepted !== false,
      revoked: payload.revoked === true,
      timestamp: new Date().toISOString(),
      trace_id: payload.trace_id || null,
    };
    this._items.unshift(item);
    if (this._items.length > MAX_CONSENTS) this._items.length = MAX_CONSENTS;
    return item;
  }

  list(tenant_id = null) {
    if (!tenant_id) return [...this._items];
    return this._items.filter((entry) => entry.tenant_id === tenant_id);
  }
}

export const consentEngine = new ConsentEngine();
