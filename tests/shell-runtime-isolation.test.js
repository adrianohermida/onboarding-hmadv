// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installRuntimeIsolation } from '../js/shell-runtime-isolation.js';

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
  });

  afterEach(() => {
    document.addEventListener = originalDocumentAddEventListener;
    window.addEventListener = originalWindowAddEventListener;
    window.setTimeout = originalSetTimeout;
    window.setInterval = originalSetInterval;
    window.clearTimeout = originalClearTimeout;
    window.clearInterval = originalClearInterval;
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
    const clearTimeoutSpy = vi.fn();
    const clearIntervalSpy = vi.fn();

    window.setTimeout = vi.fn(() => 101);
    window.setInterval = vi.fn(() => 202);
    window.clearTimeout = clearTimeoutSpy;
    window.clearInterval = clearIntervalSpy;

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

    expect(clearTimeoutSpy).toHaveBeenCalledWith(101);
    expect(clearIntervalSpy).toHaveBeenCalledWith(202);
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