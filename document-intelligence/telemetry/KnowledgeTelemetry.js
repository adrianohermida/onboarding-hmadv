const MAX_ITEMS = 2500;

export class KnowledgeTelemetry {
  constructor() {
    this._items = [];
  }

  track(payload = {}) {
    const item = {
      event: payload.event || 'knowledge.accessed',
      tenant_id: payload.tenant_id || 'hmadv',
      actor_id: payload.actor_id || 'system',
      completion_state: payload.completion_state || null,
      progress: Number(payload.progress) || 0,
      details: payload.details || {},
      timestamp: new Date().toISOString(),
    };
    this._items.unshift(item);
    if (this._items.length > MAX_ITEMS) this._items.length = MAX_ITEMS;
    return item;
  }

  snapshot() {
    return {
      total: this._items.length,
      videos_watched: this._items.filter((i) => i.event === 'knowledge.video.watched').length,
      onboarding_progress_events: this._items.filter((i) => i.event === 'knowledge.onboarding.progress').length,
      documents_accessed: this._items.filter((i) => i.event === 'knowledge.document.accessed').length,
      template_used: this._items.filter((i) => i.event === 'knowledge.template.used').length,
      onboarding_abandonment: this._items.filter((i) => i.event === 'knowledge.onboarding.abandoned').length,
      list: [...this._items],
    };
  }
}

export const knowledgeTelemetry = new KnowledgeTelemetry();
