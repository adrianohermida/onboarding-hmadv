const MAX_MODULE_EVENTS = 1000;

export class ModuleObservability {
  constructor() {
    this._events = [];
  }

  record(module_name, payload = {}) {
    const event = {
      module_name,
      load_time_ms: Number(payload.load_time_ms) || 0,
      render_time_ms: Number(payload.render_time_ms) || 0,
      failures: Number(payload.failures) || 0,
      retries: Number(payload.retries) || 0,
      memory_usage_bytes: Number(payload.memory_usage_bytes) || 0,
      event_throughput: Number(payload.event_throughput) || 0,
      timestamp: new Date().toISOString(),
    };
    this._events.unshift(event);
    if (this._events.length > MAX_MODULE_EVENTS) this._events.length = MAX_MODULE_EVENTS;
    return event;
  }

  snapshot(module_name = null) {
    const events = module_name ? this._events.filter((item) => item.module_name === module_name) : this._events;
    return {
      total: events.length,
      failures: events.reduce((sum, item) => sum + item.failures, 0),
      retries: events.reduce((sum, item) => sum + item.retries, 0),
      avg_load_ms: events.length ? Math.round(events.reduce((sum, item) => sum + item.load_time_ms, 0) / events.length) : 0,
      avg_render_ms: events.length ? Math.round(events.reduce((sum, item) => sum + item.render_time_ms, 0) / events.length) : 0,
      list: [...events],
    };
  }
}

export const moduleObservability = new ModuleObservability();
