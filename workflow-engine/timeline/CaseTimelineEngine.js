const MAX_TIMELINE = 3000;

export class CaseTimelineEngine {
  constructor() {
    this._items = [];
  }

  add(payload = {}) {
    const item = {
      case_id: payload.case_id || null,
      tenant_id: payload.tenant_id || 'hmadv',
      actor: payload.actor || 'system',
      event: payload.event || 'timeline.event',
      workflow_id: payload.workflow_id || null,
      trace_id: payload.trace_id || null,
      category: payload.category || 'workflow',
      details: payload.details || {},
      timestamp: new Date().toISOString(),
    };

    this._items.unshift(item);
    if (this._items.length > MAX_TIMELINE) this._items.length = MAX_TIMELINE;
    return item;
  }

  list(case_id = null) {
    if (!case_id) return [...this._items];
    return this._items.filter((item) => item.case_id === case_id);
  }
}

export const caseTimelineEngine = new CaseTimelineEngine();
