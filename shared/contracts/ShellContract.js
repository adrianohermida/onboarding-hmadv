/**
 * ShellContract — the ONLY way modules communicate with the shell.
 *
 * Modules MUST NOT import shell internals directly.
 * All shell interaction goes through these contracts.
 *
 * This decoupling means:
 * - Shell internals can change without breaking modules
 * - Modules are testable in isolation
 * - Future: server-rendered or native shell can swap out
 */
import { globalModal }       from '../../shell/modals/GlobalModalRoot.js';
import { globalSlideover }   from '../../shell/slideovers/SlideoverRoot.js';
import { store }             from '../../shell/state/ShellStore.js';
import { loadingLayer }      from '../../shell/layout/GlobalLoadingLayer.js';
import { notificationCenter } from '../../shell/notifications/NotificationCenter.js';
import { obs }               from '../../shell/observability/Observability.js';
import { bus }               from '../../modules/events/EventBus.js';

// ── Modal API ──────────────────────────────────────────────────────────────────
export const modal = {
  open:     (opts)    => globalModal.open(opts),
  close:    (id)      => globalModal.close(id),
  closeAll: ()        => globalModal.closeAll(),
};

// ── Slideover API ──────────────────────────────────────────────────────────────
export const slideover = {
  open:     (opts)    => globalSlideover.open(opts),
  close:    (id)      => globalSlideover.close(id),
  closeAll: ()        => globalSlideover.closeAll(),
};

// ── Loading API ────────────────────────────────────────────────────────────────
export const loading = {
  start:  () => loadingLayer.start(),
  finish: () => loadingLayer.finish(),
  error:  () => loadingLayer.error(),
};

// ── Auth API (read-only for modules) ──────────────────────────────────────────
export const auth = {
  getUser:    () => store.get('auth')?.user    || null,
  isAdmin:    () => store.get('auth')?.isAdmin || false,
  isLoaded:   () => store.get('auth')?.loaded  || false,
  getViewMode: () => store.getViewMode(),
  setViewMode: (mode) => store.setViewMode(mode),
};

// ── Notifications API ──────────────────────────────────────────────────────────
export const notify = {
  push: (item) => store.addNotification(item),
};

// ── Events API ─────────────────────────────────────────────────────────────────
export const events = {
  emit: (name, data)    => bus.emit(name, data),
  on:   (name, handler) => bus.on(name, handler),
  off:  (name, handler) => bus.off(name, handler),
};

// ── Observability API ──────────────────────────────────────────────────────────
export const telemetry = {
  log:   (event, data)  => obs._log(event, data),
  error: (msg, ctx)     => obs.error(msg, ctx),
};

// ── Tenant API ─────────────────────────────────────────────────────────────────
export const tenant = {
  getId:       () => store.get('tenant')?.id       || 'hmadv',
  getName:     () => store.get('tenant')?.name     || '',
  getBranding: () => store.get('tenant')?.branding || {},
};

// ── Store API (limited surface) ────────────────────────────────────────────────
export const shellStore = {
  subscribe: (slice, handler) => store.subscribe(slice, handler),
};

// Convenience default export (barrel)
export default { modal, slideover, loading, auth, notify, events, telemetry, tenant, shellStore };
