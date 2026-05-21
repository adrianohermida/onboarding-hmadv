const MAX_LOGS = 1200;

export class IntegrationLogger {
  constructor() {
    this._entries = [];
  }

  log(type, payload = {}) {
    const entry = {
      type,
      provider: payload.provider || 'unknown',
      operation: payload.operation || 'unknown',
      tenant_id: payload.tenant_id || 'hmadv',
      workflow_id: payload.workflow_id || null,
      actor_id: payload.actor_id || null,
      retries: Number(payload.retries) || 0,
      request: payload.request || null,
      response: payload.response || null,
      failure: payload.failure ? String(payload.failure) : null,
      timestamp: new Date().toISOString(),
    };

    this._entries.unshift(entry);
    if (this._entries.length > MAX_LOGS) this._entries.length = MAX_LOGS;
    return entry;
  }

  list() {
    return [...this._entries];
  }
}

export const integrationLogger = new IntegrationLogger();
