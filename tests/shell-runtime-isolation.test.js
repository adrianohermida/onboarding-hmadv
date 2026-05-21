// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installRuntimeIsolation } from '../js/shell-runtime-isolation.js';

const REAL_SET_TIMEOUT = globalThis.setTimeout;
const REAL_SET_INTERVAL = globalThis.setInterval;
const REAL_CLEAR_TIMEOUT = globalThis.clearTimeout;
const REAL_CLEAR_INTERVAL = globalThis.clearInterval;

describe('shell runtime isolation', () => {
  let enabled;
  let capture;
  let activeToken;
  let originalDocumentAddEventListener;
  let originalWindowAddEventListener;
  let originalSetTimeout;
  let originalSetInterval;
  let originalClearTimeout;
  let originalClearInterval;

  beforeEach(() => {
    enabled = true;
    capture = true;
    activeToken = 1;
    originalDocumentAddEventListener = document.addEventListener;
    originalWindowAddEventListener = window.addEventListener;
    originalSetTimeout = window.setTimeout;
    originalSetInterval = window.setInterval;
    originalClearTimeout = window.clearTimeout;
    originalClearInterval = window.clearInterval;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();

    // Restore globals first so jsdom teardown never sees missing timer APIs.
    if (typeof REAL_SET_TIMEOUT === 'function') globalThis.setTimeout = REAL_SET_TIMEOUT;
    if (typeof REAL_SET_INTERVAL === 'function') globalThis.setInterval = REAL_SET_INTERVAL;
    if (typeof REAL_CLEAR_TIMEOUT === 'function') globalThis.clearTimeout = REAL_CLEAR_TIMEOUT;
    if (typeof REAL_CLEAR_INTERVAL === 'function') globalThis.clearInterval = REAL_CLEAR_INTERVAL;

    document.addEventListener = originalDocumentAddEventListener;
    window.addEventListener = originalWindowAddEventListener;
    window.setTimeout = originalSetTimeout || REAL_SET_TIMEOUT;
    window.setInterval = originalSetInterval || REAL_SET_INTERVAL;
    window.clearTimeout = originalClearTimeout || REAL_CLEAR_TIMEOUT;
    window.clearInterval = originalClearInterval || REAL_CLEAR_INTERVAL;
  });

  it('prevents listeners from a previous route token from firing after route swap', () => {
    installRuntimeIsolation({
      isEnabled: () => enabled,
      isCaptureEnabled: () => capture,
      getActiveToken: () => activeToken,
      telemetry: { sampleRate: 1, maxEvents: 10, maxPerRoute: 10 },
    });

    const staleListener = vi.fn();
    document.addEventListener('portal:test-route', staleListener);

    activeToken = 2;
    document.dispatchEvent(new CustomEvent('portal:test-route'));

    expect(staleListener).not.toHaveBeenCalled();
  });

  it('cleans up timers captured for the previous route during navigation teardown', () => {
    const runtimeIsolation = installRuntimeIsolation({
      isEnabled: () => enabled,
      isCaptureEnabled: () => capture,
      getActiveToken: () => activeToken,
      telemetry: { sampleRate: 1, maxEvents: 10, maxPerRoute: 10 },
    });

    const timeoutFn = vi.fn();
    const intervalFn = vi.fn();

    window.setTimeout(timeoutFn, 50);
    window.setInterval(intervalFn, 50);

    runtimeIsolation.cleanupModuleTimers();
    vi.advanceTimersByTime(200);

    expect(timeoutFn).not.toHaveBeenCalled();
    expect(intervalFn).not.toHaveBeenCalled();
  });

  it('removes captured listeners on simulated route teardown before the next module mounts', () => {
    const runtimeIsolation = installRuntimeIsolation({
      isEnabled: () => enabled,
      isCaptureEnabled: () => capture,
      getActiveToken: () => activeToken,
      telemetry: { sampleRate: 1, maxEvents: 10, maxPerRoute: 10 },
    });

    const listener = vi.fn();
    window.addEventListener('portal:test-window', listener);

    runtimeIsolation.cleanupModuleListeners();
    window.dispatchEvent(new CustomEvent('portal:test-window'));

    expect(listener).not.toHaveBeenCalled();
  });
});