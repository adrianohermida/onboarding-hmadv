const MAX_RETRIEVAL = 8000;

export class RetrievalFoundation {
  constructor() {
    this._items = [];
  }

  retrieve(payload = {}) {
    const item = {
      retrieval_id: payload.retrieval_id || `ai_ret_${Date.now()}`,
      tenant_id: payload.tenant_id || 'hmadv',
      source: payload.source || 'knowledge',
      query: payload.query || '',
      hits: payload.hits || [],
      latency_ms: Number(payload.latency_ms) || 0,
      timestamp: new Date().toISOString(),
    };
    this._items.unshift(item);
    if (this._items.length > MAX_RETRIEVAL) this._items.length = MAX_RETRIEVAL;
    return item;
  }

  list(tenant_id = null) {
    if (!tenant_id) return [...this._items];
    return this._items.filter((entry) => entry.tenant_id === tenant_id);
  }
}

export const retrievalFoundation = new RetrievalFoundation();
