const CLASSIFICATIONS = [
  'PUBLICO',
  'INTERNO',
  'CONFIDENCIAL',
  'SENSIVEL',
  'BIOMETRICO',
  'FINANCEIRO',
  'JURIDICO',
  'LGPD_CRITICO',
];

const MAX_CLASSIFIED = 10000;

export class DataClassificationEngine {
  constructor() {
    this._items = [];
  }

  classify(payload = {}) {
    const classification = CLASSIFICATIONS.includes(payload.classification)
      ? payload.classification
      : 'INTERNO';

    const item = {
      classification_id: payload.classification_id || `clf_${Date.now()}`,
      tenant_id: payload.tenant_id || 'hmadv',
      resource: payload.resource || 'unknown',
      resource_id: payload.resource_id || null,
      classification,
      actor_id: payload.actor_id || 'system',
      timestamp: new Date().toISOString(),
    };

    this._items.unshift(item);
    if (this._items.length > MAX_CLASSIFIED) this._items.length = MAX_CLASSIFIED;
    return item;
  }

  list(tenant_id = null) {
    if (!tenant_id) return [...this._items];
    return this._items.filter((entry) => entry.tenant_id === tenant_id);
  }
}

export const dataClassificationEngine = new DataClassificationEngine();
export { CLASSIFICATIONS };
