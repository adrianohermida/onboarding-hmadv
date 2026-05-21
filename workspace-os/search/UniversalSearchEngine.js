const MAX_INDEX = 8000;

class UniversalSearchEngine {
  constructor() {
    this._index = [];
  }

  index(payload = {}) {
    const item = {
      search_id: payload.search_id || `ws_${Date.now()}`,
      tenant_id: payload.tenant_id || 'hmadv',
      entity_type: payload.entity_type || 'module',
      entity_id: payload.entity_id || null,
      title: payload.title || 'item',
      tags: Array.isArray(payload.tags) ? payload.tags : [],
      href: payload.href || null,
      timestamp: new Date().toISOString(),
    };
    this._index.unshift(item);
    if (this._index.length > MAX_INDEX) this._index.length = MAX_INDEX;
    return item;
  }

  query(term = '', tenant_id = 'hmadv') {
    const normalized = String(term || '').toLowerCase().trim();
    const list = this._index.filter((entry) => entry.tenant_id === tenant_id);
    if (!normalized) return list.slice(0, 40);
    return list
      .filter((entry) => `${entry.entity_type} ${entry.title} ${(entry.tags || []).join(' ')}`.toLowerCase().includes(normalized))
      .slice(0, 40);
  }

  snapshot(tenant_id = 'hmadv', term = '') {
    const list = this.query(term, tenant_id);
    return {
      total: this._index.filter((entry) => entry.tenant_id === tenant_id).length,
      results: list.length,
      by_type: list.reduce((acc, entry) => {
        acc[entry.entity_type] = (acc[entry.entity_type] || 0) + 1;
        return acc;
      }, {}),
      list,
    };
  }
}

export const universalSearchEngine = new UniversalSearchEngine();
