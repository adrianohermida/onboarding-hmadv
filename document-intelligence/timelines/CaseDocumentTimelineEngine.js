const MAX_TIMELINE = 4000;

export class CaseDocumentTimelineEngine {
  constructor() {
    this._events = [];
  }

  add(payload = {}) {
    const event = {
      case_id: payload.case_id || null,
      document_id: payload.document_id || null,
      event: payload.event || 'document.event',
      tenant_id: payload.tenant_id || 'hmadv',
      actor_id: payload.actor_id || 'system',
      workflow_id: payload.workflow_id || null,
      trace_id: payload.trace_id || null,
      details: payload.details || {},
      timestamp: new Date().toISOString(),
    };
    this._events.unshift(event);
    if (this._events.length > MAX_TIMELINE) this._events.length = MAX_TIMELINE;
    return event;
  }

  list(case_id = null) {
    if (!case_id) return [...this._events];
    return this._events.filter((item) => item.case_id === case_id);
  }
}

export const caseDocumentTimelineEngine = new CaseDocumentTimelineEngine();
