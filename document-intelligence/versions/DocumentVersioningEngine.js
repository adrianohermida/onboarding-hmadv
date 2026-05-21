const MAX_VERSION_ROWS = 3000;

export class DocumentVersioningEngine {
  constructor() {
    this._rows = [];
  }

  addRevision(payload = {}) {
    const row = {
      document_id: payload.document_id,
      version: Number(payload.version) || 1,
      revision: payload.revision || `rev_${Date.now()}`,
      approval_history: Array.isArray(payload.approval_history) ? payload.approval_history : [],
      signature_history: Array.isArray(payload.signature_history) ? payload.signature_history : [],
      audit: payload.audit || {},
      tenant_id: payload.tenant_id || 'hmadv',
      actor_id: payload.actor_id || 'system',
      timestamp: new Date().toISOString(),
    };
    this._rows.unshift(row);
    if (this._rows.length > MAX_VERSION_ROWS) this._rows.length = MAX_VERSION_ROWS;
    return row;
  }

  list(document_id = null) {
    if (!document_id) return [...this._rows];
    return this._rows.filter((row) => row.document_id === document_id);
  }
}

export const documentVersioningEngine = new DocumentVersioningEngine();
