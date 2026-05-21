const MAX_DEPLOYMENTS = 2000;

export class DeploymentFoundation {
  constructor() {
    this._items = [];
  }

  register(payload = {}) {
    const item = {
      deployment_id: payload.deployment_id || `dep_${Date.now()}`,
      tenant_id: payload.tenant_id || 'hmadv',
      environment: payload.environment || 'production',
      strategy: payload.strategy || 'rolling',
      status: payload.status || 'success',
      rollback_ready: payload.rollback_ready !== false,
      observability_ready: payload.observability_ready !== false,
      trace_id: payload.trace_id || null,
      timestamp: new Date().toISOString(),
    };
    this._items.unshift(item);
    if (this._items.length > MAX_DEPLOYMENTS) this._items.length = MAX_DEPLOYMENTS;
    return item;
  }

  list(tenant_id = null) {
    if (!tenant_id) return [...this._items];
    return this._items.filter((entry) => entry.tenant_id === tenant_id);
  }
}

export const deploymentFoundation = new DeploymentFoundation();
