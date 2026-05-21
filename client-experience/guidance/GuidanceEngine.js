const MAX_GUIDANCE = 5000;

export class GuidanceEngine {
  constructor() {
    this._items = [];
  }

  addStep(payload = {}) {
    const item = {
      guidance_id: payload.guidance_id || `cxgui_${Date.now()}`,
      tenant_id: payload.tenant_id || 'hmadv',
      client_id: payload.client_id || null,
      step: payload.step || 'proximo_passo',
      priority: payload.priority || 'normal',
      message: payload.message || 'Vamos seguir para a proxima etapa com tranquilidade.',
      due_at: payload.due_at || null,
      status: payload.status || 'open',
      timestamp: new Date().toISOString(),
    };

    this._items.unshift(item);
    if (this._items.length > MAX_GUIDANCE) this._items.length = MAX_GUIDANCE;
    return item;
  }

  list(tenant_id = null) {
    if (!tenant_id) return [...this._items];
    return this._items.filter((entry) => entry.tenant_id === tenant_id);
  }
}

export const guidanceEngine = new GuidanceEngine();
