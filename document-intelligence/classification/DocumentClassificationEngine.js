import { resolveDocumentCategory } from '../taxonomy/DocumentTaxonomy.js';

const MAX_CLASSIFICATIONS = 2000;

export class DocumentClassificationEngine {
  constructor() {
    this._items = [];
  }

  classifyManual(payload = {}) {
    return this._record({
      method: 'manual',
      document_id: payload.document_id,
      type: payload.type,
      category: payload.category || resolveDocumentCategory(payload.type) || 'juridico',
      tenant_id: payload.tenant_id || 'hmadv',
      actor_id: payload.actor_id || 'system',
      workflow_id: payload.workflow_id || null,
    });
  }

  classifyWorkflow(payload = {}) {
    return this._record({
      method: 'workflow',
      document_id: payload.document_id,
      type: payload.type,
      category: payload.category || resolveDocumentCategory(payload.type) || 'juridico',
      tenant_id: payload.tenant_id || 'hmadv',
      actor_id: payload.actor_id || 'workflow-engine',
      workflow_id: payload.workflow_id || null,
    });
  }

  classifyAutoFuture(payload = {}) {
    return this._record({
      method: 'auto_future',
      document_id: payload.document_id,
      type: payload.type,
      category: payload.category || resolveDocumentCategory(payload.type) || 'juridico',
      tenant_id: payload.tenant_id || 'hmadv',
      actor_id: payload.actor_id || 'ai-classifier',
      workflow_id: payload.workflow_id || null,
    });
  }

  _record(item = {}) {
    const row = {
      ...item,
      timestamp: new Date().toISOString(),
    };
    this._items.unshift(row);
    if (this._items.length > MAX_CLASSIFICATIONS) this._items.length = MAX_CLASSIFICATIONS;
    return row;
  }

  list(document_id = null) {
    if (!document_id) return [...this._items];
    return this._items.filter((item) => item.document_id === document_id);
  }
}

export const documentClassificationEngine = new DocumentClassificationEngine();
