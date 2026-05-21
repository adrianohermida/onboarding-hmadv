const MAX_SECURITY_ITEMS = 500;

export class SecurityObservability {
  constructor() {
    this._items = [];
  }

  track(type, payload = {}) {
    const item = {
      type,
      tenant_id: payload.tenant_id || 'hmadv',
      actor_id: payload.actor_id || null,
      trace_id: payload.trace_id || null,
      metadata: payload.metadata || {},
      timestamp: new Date().toISOString(),
    };
    this._items.unshift(item);
    if (this._items.length > MAX_SECURITY_ITEMS) this._items.length = MAX_SECURITY_ITEMS;
    return item;
  }

  snapshot() {
    const count = (name) => this._items.filter((item) => item.type === name).length;
    return {
      login_failures: count('login.failure'),
      token_failures: count('token.failure'),
      suspicious_access: count('suspicious.access'),
      upload_violations: count('upload.violation'),
      permission_violations: count('permission.violation'),
      webhook_failures: count('webhook.failure'),
      total: this._items.length,
    };
  }
}

export const securityObservability = new SecurityObservability();
