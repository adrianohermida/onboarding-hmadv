import { bus } from '../../modules/events/EventBus.js';

export class ShellAnalytics {
  constructor() {
    this._unsubscribers = [];
  }

  init() {
    this.destroy();
    this._unsubscribers = [
      bus.on('shell.ready', detail => this.track('shell.ready', detail)),
      bus.on('tenant.changed', detail => this.track('tenant.changed', detail)),
      bus.on('auth.changed', detail => this.track('auth.changed', detail)),
      bus.on('shell.runtime.selected', detail => this.track('shell.runtime.selected', detail)),
      bus.on('shell.runtime.boot.success', detail => this.track('shell.runtime.boot.success', detail)),
      bus.on('shell.runtime.boot.failure', detail => this.track('shell.runtime.boot.failure', detail)),
      bus.on('shell.runtime.fallback', detail => this.track('shell.runtime.fallback', detail)),
    ];
    return this;
  }

  track(event, payload = {}) {
    window.__shellAnalytics = window.__shellAnalytics || [];
    window.__shellAnalytics.push({ event, payload, ts: Date.now() });
  }

  destroy() {
    this._unsubscribers.forEach(unsub => {
      try { unsub(); } catch (_) {}
    });
    this._unsubscribers = [];
  }
}

export const shellAnalytics = new ShellAnalytics();
export default shellAnalytics;
