export function installRuntimeIsolation({
  isEnabled,
  isCaptureEnabled,
  getActiveToken,
  eventName = 'shell:callback-suppressed',
  telemetry = {},
} = {}) {
  const config = {
    sampleRate: Number.isFinite(telemetry.sampleRate) ? telemetry.sampleRate : 0.6,
    maxEvents: Number.isFinite(telemetry.maxEvents) ? telemetry.maxEvents : 100,
    maxPerRoute: Number.isFinite(telemetry.maxPerRoute) ? telemetry.maxPerRoute : 24,
  };

  const nativeDocumentAddEventListener = document.addEventListener.bind(document);
  const nativeDocumentRemoveEventListener = document.removeEventListener.bind(document);
  const nativeWindowAddEventListener = window.addEventListener.bind(window);
  const nativeWindowRemoveEventListener = window.removeEventListener.bind(window);
  const nativeSetTimeout = window.setTimeout.bind(window);
  const nativeClearTimeout = window.clearTimeout.bind(window);
  const nativeSetInterval = window.setInterval.bind(window);
  const nativeClearInterval = window.clearInterval.bind(window);

  const capturedListeners = [];
  const capturedTimers = [];
  const routeSampledCounts = {};

  function inferModuleFromStack(stack = '') {
    if (!stack) return 'unknown';
    const normalized = String(stack).replaceAll('\\', '/');
    const pageMatch = normalized.match(/pages\/[\w-]+\.html/i);
    if (pageMatch?.[0]) return pageMatch[0].toLowerCase();
    const jsMatch = normalized.match(/js\/[\w-]+\.js/i);
    if (jsMatch?.[0]) return jsMatch[0].toLowerCase();
    return 'unknown';
  }

  function routeKeyFromModule(moduleName = '') {
    if (!moduleName || moduleName === 'unknown') return 'unknown';
    const normalized = String(moduleName).toLowerCase();
    const pageMatch = normalized.match(/pages\/([\w-]+)\.html/);
    if (pageMatch?.[1]) return pageMatch[1];
    const jsMatch = normalized.match(/js\/([\w-]+)\.js/);
    if (jsMatch?.[1]) return jsMatch[1];
    return normalized;
  }

  function appendTelemetry(detail) {
    try {
      if (!Array.isArray(window.__shellSuppressedCallbacks)) {
        window.__shellSuppressedCallbacks = [];
      }
      if (!window.__shellSuppressedByRoute || typeof window.__shellSuppressedByRoute !== 'object') {
        window.__shellSuppressedByRoute = {};
      }
      if (!window.__shellTelemetry || typeof window.__shellTelemetry !== 'object') {
        window.__shellTelemetry = {
          sampled: [],
          byRoute: {},
          droppedByRoute: {},
          config,
        };
      }

      const telemetryState = window.__shellTelemetry;
      const route = detail.route || 'unknown';
      telemetryState.byRoute[route] = (telemetryState.byRoute[route] || 0) + 1;

      const sampledCount = routeSampledCounts[route] || 0;
      if (sampledCount >= config.maxPerRoute) {
        telemetryState.droppedByRoute[route] = (telemetryState.droppedByRoute[route] || 0) + 1;
        return;
      }

      routeSampledCounts[route] = sampledCount + 1;

      window.__shellSuppressedCallbacks.push(detail);
      telemetryState.sampled.push(detail);

      while (window.__shellSuppressedCallbacks.length > config.maxEvents) {
        const removed = window.__shellSuppressedCallbacks.shift();
        if (removed?.route) {
          routeSampledCounts[removed.route] = Math.max(0, (routeSampledCounts[removed.route] || 1) - 1);
        }
      }

      while (telemetryState.sampled.length > config.maxEvents) {
        telemetryState.sampled.shift();
      }

      window.__shellSuppressedByRoute[route] = telemetryState.byRoute[route];
      detail.countsByRoute = { ...telemetryState.byRoute };

      window.dispatchEvent(new CustomEvent(eventName, { detail }));
    } catch (_) {}
  }

  function reportSuppressed(kind, error, source = 'listener') {
    if (Math.random() > config.sampleRate) return;

    const message = error?.message || String(error || 'unknown error');
    const stack = error?.stack || '';
    const module = inferModuleFromStack(stack);
    const route = routeKeyFromModule(module);

    appendTelemetry({
      kind,
      source,
      message,
      stack: stack ? String(stack).slice(0, 800) : '',
      module,
      route,
      ts: Date.now(),
    });
  }

  function runSafely(kind, fn, ctx, args) {
    try {
      const result = fn.apply(ctx, args);
      if (result && typeof result.then === 'function' && typeof result.catch === 'function') {
        result.catch(error => {
          reportSuppressed(kind, error, 'async');
          console.warn(`[shell:${kind}] async listener/timer error suppressed`, error);
        });
      }
      return result;
    } catch (error) {
      reportSuppressed(kind, error, 'sync');
      console.warn(`[shell:${kind}] listener/timer error suppressed`, error);
      return undefined;
    }
  }

  function trackListener(target, type, wrapped, options) {
    if (!isCaptureEnabled?.()) return;
    capturedListeners.push({ target, type, wrapped, options });
  }

  function cleanupModuleListeners() {
    while (capturedListeners.length) {
      const item = capturedListeners.pop();
      if (!item) continue;
      if (item.target === document) {
        nativeDocumentRemoveEventListener(item.type, item.wrapped, item.options);
      } else if (item.target === window) {
        nativeWindowRemoveEventListener(item.type, item.wrapped, item.options);
      }
    }
  }

  function cleanupModuleTimers() {
    while (capturedTimers.length) {
      const timer = capturedTimers.pop();
      if (!timer) continue;
      if (timer.kind === 'timeout') nativeClearTimeout(timer.id);
      if (timer.kind === 'interval') nativeClearInterval(timer.id);
    }
  }

  document.addEventListener = function patchedDocumentAddEventListener(type, listener, options) {
    if (!isEnabled?.()) return nativeDocumentAddEventListener(type, listener, options);
    if (!isCaptureEnabled?.() || typeof listener !== 'function') {
      return nativeDocumentAddEventListener(type, listener, options);
    }

    const token = getActiveToken?.() ?? 0;
    const wrapped = function wrappedDocumentListener(...args) {
      if (token !== (getActiveToken?.() ?? 0)) return;
      return runSafely('document', listener, this, args);
    };

    nativeDocumentAddEventListener(type, wrapped, options);
    trackListener(document, type, wrapped, options);
  };

  window.addEventListener = function patchedWindowAddEventListener(type, listener, options) {
    if (!isEnabled?.()) return nativeWindowAddEventListener(type, listener, options);
    if (!isCaptureEnabled?.() || typeof listener !== 'function') {
      return nativeWindowAddEventListener(type, listener, options);
    }

    const token = getActiveToken?.() ?? 0;
    const wrapped = function wrappedWindowListener(...args) {
      if (token !== (getActiveToken?.() ?? 0)) return;
      return runSafely('window', listener, this, args);
    };

    nativeWindowAddEventListener(type, wrapped, options);
    trackListener(window, type, wrapped, options);
  };

  window.setTimeout = function patchedSetTimeout(handler, timeout, ...args) {
    if (!isEnabled?.()) return nativeSetTimeout(handler, timeout, ...args);
    if (!isCaptureEnabled?.() || typeof handler !== 'function') {
      return nativeSetTimeout(handler, timeout, ...args);
    }

    const token = getActiveToken?.() ?? 0;
    const wrapped = (...cbArgs) => {
      if (token !== (getActiveToken?.() ?? 0)) return;
      return runSafely('timeout', handler, window, cbArgs);
    };

    const id = nativeSetTimeout(wrapped, timeout, ...args);
    capturedTimers.push({ kind: 'timeout', id });
    return id;
  };

  window.clearTimeout = function patchedClearTimeout(id) {
    return nativeClearTimeout(id);
  };

  window.setInterval = function patchedSetInterval(handler, timeout, ...args) {
    if (!isEnabled?.()) return nativeSetInterval(handler, timeout, ...args);
    if (!isCaptureEnabled?.() || typeof handler !== 'function') {
      return nativeSetInterval(handler, timeout, ...args);
    }

    const token = getActiveToken?.() ?? 0;
    const wrapped = (...cbArgs) => {
      if (token !== (getActiveToken?.() ?? 0)) return;
      return runSafely('interval', handler, window, cbArgs);
    };

    const id = nativeSetInterval(wrapped, timeout, ...args);
    capturedTimers.push({ kind: 'interval', id });
    return id;
  };

  window.clearInterval = function patchedClearInterval(id) {
    return nativeClearInterval(id);
  };

  return {
    reportSuppressed,
    runSafely,
    cleanupModuleListeners,
    cleanupModuleTimers,
    nativeDocumentAddEventListener,
    nativeWindowAddEventListener,
  };
}