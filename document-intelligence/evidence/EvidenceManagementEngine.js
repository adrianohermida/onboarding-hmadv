const MAX_EVIDENCE = 2000;

export class EvidenceManagementEngine {
  constructor() {
    this._items = [];
  }

  register(payload = {}) {
    const item = {
      evidence_id: payload.evidence_id || `ev_${Date.now()}`,
      case_id: payload.case_id || null,
      document_id: payload.document_id || null,
      category: payload.category || 'financial',
      type: payload.type || 'attachment',
      tenant_id: payload.tenant_id || 'hmadv',
      owner_id: payload.owner_id || 'system',
      trace_id: payload.trace_id || null,
      workflow_id: payload.workflow_id || null,
      details: payload.details || {},
      timestamp: new Date().toISOString(),
    };
    this._items.unshift(item);
    if (this._items.length > MAX_EVIDENCE) this._items.length = MAX_EVIDENCE;
    return item;
  }

  list(case_id = null) {
    if (!case_id) return [...this._items];
    return this._items.filter((item) => item.case_id === case_id);
  }
}

export const evidenceManagementEngine = new EvidenceManagementEngine();
