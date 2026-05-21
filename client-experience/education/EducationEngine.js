const MAX_EDUCATION_ITEMS = 6000;

export class EducationEngine {
  constructor() {
    this._items = [];
  }

  register(payload = {}) {
    const item = {
      education_id: payload.education_id || `cxedu_${Date.now()}`,
      tenant_id: payload.tenant_id || 'hmadv',
      client_id: payload.client_id || null,
      topic: payload.topic || 'cartilha_cnj',
      type: payload.type || 'video',
      completed: payload.completed === true,
      duration_minutes: Number(payload.duration_minutes) || 0,
      timestamp: new Date().toISOString(),
    };

    this._items.unshift(item);
    if (this._items.length > MAX_EDUCATION_ITEMS) this._items.length = MAX_EDUCATION_ITEMS;
    return item;
  }

  list(tenant_id = null) {
    if (!tenant_id) return [...this._items];
    return this._items.filter((entry) => entry.tenant_id === tenant_id);
  }
}

export const educationEngine = new EducationEngine();
