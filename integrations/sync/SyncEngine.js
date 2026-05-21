import { normalizeSyncPayload } from '../../shared/contracts/integrations/SyncContracts.js';
import { integrationLogger } from '../logs/IntegrationLogger.js';

const MAX_SYNC_ITEMS = 1000;

export class SyncEngine {
  constructor() {
    this._items = [];
  }

  record(payload = {}) {
    const item = normalizeSyncPayload(payload);
    this._items.unshift(item);
    if (this._items.length > MAX_SYNC_ITEMS) this._items.length = MAX_SYNC_ITEMS;

    integrationLogger.log('sync.recorded', {
      provider: item.provider,
      operation: `sync.${item.entity}`,
      tenant_id: item.tenant_id,
      workflow_id: item.workflow_id,
      request: item,
    });

    return item;
  }

  snapshot(entity = null) {
    const list = entity ? this._items.filter((item) => item.entity === entity) : this._items;
    return {
      total: list.length,
      list: [...list],
    };
  }
}

export const syncEngine = new SyncEngine();
