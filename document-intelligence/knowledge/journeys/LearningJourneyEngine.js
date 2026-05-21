const MAX_JOURNEY = 1000;

export class LearningJourneyEngine {
  constructor() {
    this._items = [];
  }

  track(payload = {}) {
    const row = {
      tenant_id: payload.tenant_id || 'hmadv',
      actor_id: payload.actor_id || 'system',
      journey: payload.journey || 'onboarding_legal',
      required_videos: Array.isArray(payload.required_videos) ? payload.required_videos : [],
      reading_confirmation: !!payload.reading_confirmation,
      legal_progress: Number(payload.legal_progress) || 0,
      checkpoint: payload.checkpoint || null,
      completed: !!payload.completed,
      timestamp: new Date().toISOString(),
    };
    this._items.unshift(row);
    if (this._items.length > MAX_JOURNEY) this._items.length = MAX_JOURNEY;
    return row;
  }

  snapshot(tenant_id = null) {
    const list = tenant_id ? this._items.filter((item) => item.tenant_id === tenant_id) : this._items;
    return {
      total: list.length,
      completed: list.filter((item) => item.completed).length,
      list: [...list],
    };
  }
}

export const learningJourneyEngine = new LearningJourneyEngine();
