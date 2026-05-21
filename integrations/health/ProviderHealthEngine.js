import { listProviders } from '../registry/ProviderRegistry.js';

export class ProviderHealthEngine {
  constructor() {
    this._status = new Map();
    listProviders().forEach((provider) => {
      this._status.set(provider.name, {
        status: provider.health_status || 'unknown',
        reason: null,
        checked_at: new Date().toISOString(),
      });
    });
  }

  set(provider, status, reason = null) {
    this._status.set(provider, {
      status,
      reason,
      checked_at: new Date().toISOString(),
    });
  }

  snapshot() {
    const providers = {};
    let degraded = 0;
    let down = 0;

    this._status.forEach((value, key) => {
      providers[key] = value;
      if (value.status === 'degraded') degraded += 1;
      if (value.status === 'down') down += 1;
    });

    return {
      providers,
      degraded,
      down,
      global: down > 0 ? 'critical' : degraded > 0 ? 'degraded' : 'healthy',
      checked_at: new Date().toISOString(),
    };
  }
}

export const providerHealthEngine = new ProviderHealthEngine();
