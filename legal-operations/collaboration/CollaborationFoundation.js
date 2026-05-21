export class CollaborationFoundation {
  constructor() {
    this._items = [];
  }

  add(payload = {}) {
    const item = {
      collaboration_id: payload.collaboration_id || `col_${Date.now()}`,
      tenant_id: payload.tenant_id || 'hmadv',
      case_id: payload.case_id || null,
      type: payload.type || 'comment',
      message: payload.message || '',
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

export const collaborationFoundation = new CollaborationFoundation();
