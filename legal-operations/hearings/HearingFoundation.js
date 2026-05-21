export class HearingFoundation {
  constructor() {
    this._items = [];
  }

  schedule(payload = {}) {
    const item = {
      hearing_id: payload.hearing_id || `hearing_${Date.now()}`,
      tenant_id: payload.tenant_id || 'hmadv',
      case_id: payload.case_id || null,
      type: payload.type || 'conciliacao',
      participants: Array.isArray(payload.participants) ? payload.participants : [],
      agenda: payload.agenda || [],
      documents: payload.documents || [],
      status: payload.status || 'scheduled',
      scheduled_at: payload.scheduled_at || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this._items.unshift(item);
    return item;
  }

  list(tenant_id = null) {
    if (!tenant_id) return [...this._items];
    return this._items.filter((entry) => entry.tenant_id === tenant_id);
  }
}

export const hearingFoundation = new HearingFoundation();
