/**
 * Observability — shell-level telemetry layer.
 *
 * Tracks:
 * - Route transitions + time-to-interactive
 * - Module load durations
 * - Auth failures
 * - Unhandled errors + promise rejections
 * - Performance vitals (LCP, FID, CLS where available)
 *
 * Sinks (configurable):
 * - console (dev)
 * - Supabase portal_telemetry table (prod) — fire-and-forget
 * - Future: Sentry, Datadog, Posthog
 */
import { supabase } from '../../services/supabase.js';
import { store }    from '../state/ShellStore.js';
import { observabilityFoundation } from '../../observability/ObservabilityFoundation.js';

const IS_DEV = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

export class Observability {
  constructor() {
    this._routeStart  = null;
    this._buffer      = [];
    this._flushTimer  = null;
  }

  // ── Init ────────────────────────────────────────────────────────────────────
  init() {
    this._bindErrors();
    this._bindPerformance();
    this._scheduleFlush();
    observabilityFoundation.runtimeIntelligence.captureMemory({ path: window.location.pathname });
    return this;
  }

  // ── Route ───────────────────────────────────────────────────────────────────
  routeStart(path) {
    this._routeStart = performance.now();
    this._log('route.start', { path });
  }

  routeEnd(path) {
    const ms = this._routeStart ? Math.round(performance.now() - this._routeStart) : null;
    this._log('route.end', { path, ms });
    this._routeStart = null;
  }

  // ── Module ──────────────────────────────────────────────────────────────────
  moduleLoad(name, ms) {
    this._log('module.load', { name, ms });
    observabilityFoundation.moduleObservability.record(name, {
      load_time_ms: ms,
      memory_usage_bytes: performance?.memory?.usedJSHeapSize || 0,
      event_throughput: 1,
    });
    observabilityFoundation.telemetryEngine.trackModuleLoad(name, ms, { module: name });
    if (ms > 3000) this._log('module.slow', { name, ms }, 'warn');
  }

  // ── Auth ────────────────────────────────────────────────────────────────────
  authFailure(reason) { this._log('auth.failure', { reason }, 'warn'); }
  authSuccess()       { this._log('auth.success', {}); }

  // ── Errors ──────────────────────────────────────────────────────────────────
  error(message, context = {}) { this._log('error', { message, ...context }, 'error'); }

  // ── Internal ─────────────────────────────────────────────────────────────────
  _log(event, data = {}, level = 'info') {
    const entry = {
      event,
      level,
      ts:        new Date().toISOString(),
      path:      window.location.pathname,
      tenant_id: store.get('tenant')?.id || 'hmadv',
      user_id:   store.get('auth')?.user?.id || null,
      ...data,
    };

    if (IS_DEV) {
      const style = level === 'error' ? 'color:red' : level === 'warn' ? 'color:orange' : 'color:gray';
      console.debug(`%c[Obs] ${event}`, style, data);
    }

    if (level === 'error') {
      observabilityFoundation.runtimeIntelligence.reportIssue('module.failure', {
        event,
        message: data?.message || event,
      });
    }

    this._buffer.push(entry);
  }

  _bindErrors() {
    window.addEventListener('error', e => {
      this.error(e.message, { file: e.filename, line: e.lineno });
    });
    window.addEventListener('unhandledrejection', e => {
      this.error('Unhandled promise rejection', { reason: String(e.reason) });
    });
  }

  _bindPerformance() {
    // PerformanceObserver for LCP
    if ('PerformanceObserver' in window) {
      try {
        new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            this._log('perf.lcp', { ms: Math.round(entry.startTime) });
          }
        }).observe({ type: 'largest-contentful-paint', buffered: true });
      } catch {}
    }
  }

  _scheduleFlush() {
    // Flush buffer every 30s (fire-and-forget, silent fail)
    this._flushTimer = setInterval(() => this._flush(), 30_000);
  }

  async _flush() {
    if (!this._buffer.length) return;
    const events = this._buffer.splice(0, 20); // max 20 at a time

    // Only flush errors and warnings in dev, everything in prod
    const toSend = IS_DEV ? events.filter(e => e.level !== 'info') : events;
    if (!toSend.length) return;

    try {
      await supabase.from('portal_telemetry').insert(
        toSend.map(e => ({
          event_type:  e.event,
          level:       e.level,
          tenant_id:   e.tenant_id,
          user_id:     e.user_id,
          path:        e.path,
          payload:     e,
          created_at:  e.ts,
        }))
      );
    } catch {
      // Silent fail — telemetry must never break the app
    }
  }
}

// Singleton
export const obs = new Observability();
export default obs;
