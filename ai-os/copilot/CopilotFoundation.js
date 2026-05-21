const MAX_SUGGESTIONS = 6000;

export class CopilotFoundation {
  constructor() {
    this._items = [];
  }

  suggest(payload = {}) {
    const item = {
      suggestion_id: payload.suggestion_id || `ai_cop_${Date.now()}`,
      tenant_id: payload.tenant_id || 'hmadv',
      actor_id: payload.actor_id || 'system',
      scope: payload.scope || 'workflow',
      text: payload.text || 'Sugerimos revisar as pendencias da etapa atual antes de prosseguir.',
      confidence: Number(payload.confidence) || 0.7,
      requires_human_review: payload.requires_human_review !== false,
      timestamp: new Date().toISOString(),
    };
    this._items.unshift(item);
    if (this._items.length > MAX_SUGGESTIONS) this._items.length = MAX_SUGGESTIONS;
    return item;
  }

  list(tenant_id = null) {
    if (!tenant_id) return [...this._items];
    return this._items.filter((entry) => entry.tenant_id === tenant_id);
  }
}

export const copilotFoundation = new CopilotFoundation();
