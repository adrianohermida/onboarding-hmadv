const DEFAULT_COMPONENTS = [
  'shell',
  'modules',
  'auth',
  'supabase',
  'uploads',
  'queues',
  'workers',
  'notifications',
  'integrations',
  'storage',
];

export class HealthEngine {
  constructor() {
    this._status = new Map();
    DEFAULT_COMPONENTS.forEach((name) => {
      this._status.set(name, { status: 'unknown', reason: null, updated_at: new Date().toISOString() });
    });
  }

  setComponentHealth(name, status = 'healthy', reason = null) {
    this._status.set(name, { status, reason, updated_at: new Date().toISOString() });
  }

  snapshot() {
    const components = {};
    let degraded = 0;
    let down = 0;

    this._status.forEach((value, key) => {
      components[key] = value;
      if (value.status === 'degraded') degraded += 1;
      if (value.status === 'down') down += 1;
    });

    const global = down > 0 ? 'critical' : degraded > 0 ? 'degraded' : 'healthy';

    return {
      global,
      degraded,
      down,
      components,
      checked_at: new Date().toISOString(),
    };
  }
}

export const healthEngine = new HealthEngine();
