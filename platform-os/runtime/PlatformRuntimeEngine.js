export class PlatformRuntimeEngine {
  constructor() {
    this._runtime = {
      lifecycle: 'booting',
      workers_online: 0,
      queues_online: 0,
      events_processing: 0,
      background_jobs: 0,
      isolation_enforced: true,
      health: 'unknown',
      generated_at: new Date().toISOString(),
    };
  }

  update(payload = {}) {
    this._runtime = {
      lifecycle: payload.lifecycle || this._runtime.lifecycle,
      workers_online: Number(payload.workers_online ?? this._runtime.workers_online),
      queues_online: Number(payload.queues_online ?? this._runtime.queues_online),
      events_processing: Number(payload.events_processing ?? this._runtime.events_processing),
      background_jobs: Number(payload.background_jobs ?? this._runtime.background_jobs),
      isolation_enforced: payload.isolation_enforced !== false,
      health: payload.health || this._runtime.health,
      generated_at: new Date().toISOString(),
    };

    return { ...this._runtime };
  }

  snapshot() {
    return { ...this._runtime };
  }
}

export const platformRuntimeEngine = new PlatformRuntimeEngine();
