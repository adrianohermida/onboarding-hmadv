const MAX_ACTIONS = 8000;

export class AiActionsFoundation {
  constructor() {
    this._items = [];
  }

  draft(payload = {}) {
    const item = {
      action_id: payload.action_id || `ai_act_${Date.now()}`,
      tenant_id: payload.tenant_id || 'hmadv',
      type: payload.type || 'draft_suggestion',
      content: payload.content || '',
      workflow_id: payload.workflow_id || null,
      requires_human_review: payload.requires_human_review !== false,
      status: payload.status || 'draft',
      timestamp: new Date().toISOString(),
    };
    this._items.unshift(item);
    if (this._items.length > MAX_ACTIONS) this._items.length = MAX_ACTIONS;
    return item;
  }

  list(tenant_id = null) {
    if (!tenant_id) return [...this._items];
    return this._items.filter((entry) => entry.tenant_id === tenant_id);
  }
}

export const aiActionsFoundation = new AiActionsFoundation();
