const MAX_TIMERS = 500;

export class WorkflowTimerEngine {
  constructor() {
    this._timers = [];
  }

  register(payload = {}) {
    const timer = {
      timer_id: payload.timer_id || `wt_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`,
      workflow: payload.workflow || 'unknown',
      tenant_id: payload.tenant_id || 'hmadv',
      fire_at: payload.fire_at || new Date(Date.now() + 60_000).toISOString(),
      type: payload.type || 'reminder',
      status: payload.status || 'scheduled',
      created_at: new Date().toISOString(),
    };

    this._timers.unshift(timer);
    if (this._timers.length > MAX_TIMERS) this._timers.length = MAX_TIMERS;
    return timer;
  }

  due(now = Date.now()) {
    return this._timers.filter((item) => item.status === 'scheduled' && Date.parse(item.fire_at) <= now);
  }

  complete(timer_id) {
    this._timers = this._timers.map((item) => (
      item.timer_id === timer_id ? { ...item, status: 'completed' } : item
    ));
  }
}

export const workflowTimerEngine = new WorkflowTimerEngine();
