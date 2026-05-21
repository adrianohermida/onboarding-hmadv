import { metadataIndexingFoundation } from '../indexing/IndexingFoundation.js';

export class DocumentSearchEngine {
  metadataSearch(query = {}, tenant_id = 'hmadv') {
    return metadataIndexingFoundation
      .list(tenant_id)
      .filter((item) => {
        if (query.type && item.type !== query.type) return false;
        if (query.category && item.category !== query.category) return false;
        if (query.owner_id && item.owner_id !== query.owner_id) return false;
        if (query.workflow_status && item.workflow_status !== query.workflow_status) return false;
        return true;
      });
  }

  semanticSearchFuture(payload = {}) {
    return {
      query: payload.query || '',
      tenant_id: payload.tenant_id || 'hmadv',
      status: 'planned',
      results: [],
    };
  }
}

export const documentSearchEngine = new DocumentSearchEngine();
