const MAX_PROGRESS = 8000;

export class LearningProgressEngine {
  constructor() {
    this._items = [];
  }

  track(payload = {}) {
    const item = {
      progress_id: payload.progress_id || `cxpro_${Date.now()}`,
      tenant_id: payload.tenant_id || 'hmadv',
      client_id: payload.client_id || null,
      type: payload.type || 'video_watched',
      completed: payload.completed === true,
      checkpoint: payload.checkpoint || 'onboarding',
      timestamp: new Date().toISOString(),
    };

    this._items.unshift(item);
    if (this._items.length > MAX_PROGRESS) this._items.length = MAX_PROGRESS;
    return item;
  }

  list(tenant_id = null) {
    if (!tenant_id) return [...this._items];
    return this._items.filter((entry) => entry.tenant_id === tenant_id);
  }
}

export const learningProgressEngine = new LearningProgressEngine();
