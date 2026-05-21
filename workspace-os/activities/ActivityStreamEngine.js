const MAX_ACTIVITIES = 5000;

class ActivityStreamEngine {
  constructor() {
    this._events = [];
  }

  record(payload = {}) {
    const entry = {
      activity_id: payload.activity_id || `wact_${Date.now()}`,
      tenant_id: payload.tenant_id || 'hmadv',
      type: payload.type || 'navigation',
      title: payload.title || 'Atividade operacional',
      entity_type: payload.entity_type || null,
      entity_id: payload.entity_id || null,
      trace_id: payload.trace_id || null,
      timestamp: new Date().toISOString(),
    };
    this._events.unshift(entry);
    if (this._events.length > MAX_ACTIVITIES) this._events.length = MAX_ACTIVITIES;
    return entry;
  }

  snapshot(tenant_id = 'hmadv') {
    const list = this._events.filter((entry) => entry.tenant_id === tenant_id);
    return {
      total: list.length,
      uploads: list.filter((entry) => entry.type === 'upload').length,
      onboarding: list.filter((entry) => entry.type === 'onboarding').length,
      workflows: list.filter((entry) => entry.type === 'workflow').length,
      approvals: list.filter((entry) => entry.type === 'approval').length,
      ai_suggestions: list.filter((entry) => entry.type === 'ai-suggestion').length,
      list,
    };
  }
}

export const activityStreamEngine = new ActivityStreamEngine();
