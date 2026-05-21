/**
 * AuthProvider — shell auth layer.
 *
 * Responsibilities:
 * - Session hydration on boot
 * - Token refresh monitoring
 * - Role detection (admin vs client)
 * - Auth state propagation via ShellStore + EventBus
 * - Route guard integration
 */
import { store }   from '../state/ShellStore.js';
import { bus }     from '../../modules/events/EventBus.js';
import { supabase } from '../../services/supabase.js';
import { checkIsAdmin, CaseService } from '../../services/database.js';

export class AuthProvider {
  constructor() {
    this._unsubscribe = null;
    this._impersonation = null;
  }

  // ── Boot ───────────────────────────────────────────────────────────────────
  async init() {
    // 1. Try session cache for instant render
    const cached = this._readCache();
    if (cached) {
      store.setAuth({ user: cached.user, isAdmin: cached.isAdmin });
      if (cached.isAdmin) store.setViewMode('admin');
      bus.emit('auth.ready', cached);
    }

    // 2. Verify with Supabase (fresh token check)
    const detail = await this._hydrateFromSupabase();
    this._bindAuthStateListener();
    return detail;
  }

  async _hydrateFromSupabase(event = 'INIT') {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        store.setAuth({ user: null, isAdmin: false });
        bus.emit('auth.changed', { user: null, isAdmin: false, event });
        bus.emit('auth.unauthenticated', {});
        return null;
      }

      const isAdmin = await checkIsAdmin().catch(() => false);

      if (!isAdmin) {
        try { await CaseService.ensureExists(); } catch {}
      }

      const caso = isAdmin ? null : await CaseService.get().catch(() => null);
      const detail = { user, isAdmin, caso };

      store.setAuth({ user, isAdmin });
      if (isAdmin) store.setViewMode('admin');

      this._writeCache(detail);
      bus.emit('auth.changed', { ...detail, event });
      bus.emit('auth.ready',   detail);

      document.dispatchEvent(new CustomEvent('app:user-loaded', { detail }));
      return detail;
    } catch (err) {
      console.warn('[AuthProvider] init error:', err);
      store.setAuth({ user: null, isAdmin: false });
      bus.emit('auth.error', { err });
      return null;
    }
  }

  _bindAuthStateListener() {
    if (this._unsubscribe) return;

    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session?.user) {
        store.setAuth({ user: null, isAdmin: false });
        sessionStorage.removeItem('portal:user');
        bus.emit('auth.changed', { user: null, isAdmin: false, event });
        bus.emit('auth.unauthenticated', { event });
        return;
      }

      await this._hydrateFromSupabase(event);

      if (event === 'TOKEN_REFRESHED') {
        bus.emit('auth.token.refreshed', { ts: Date.now() });
      }
    });

    const subscription = data?.subscription;
    this._unsubscribe = typeof subscription?.unsubscribe === 'function'
      ? () => subscription.unsubscribe()
      : null;
  }

  // ── Guards ─────────────────────────────────────────────────────────────────
  async requireAuth(redirectTo = 'login.html') {
    const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: {} }));
    if (!user) {
      const base = window.location.pathname.includes('/pages/') ? '' : 'pages/';
      window.location.replace(base + redirectTo);
      return false;
    }
    return true;
  }

  requireAdmin() {
    const { isAdmin } = store.get('auth');
    return isAdmin;
  }

  requireViewMode(...modes) {
    return modes.includes(store.getViewMode());
  }

  // ── Logout ─────────────────────────────────────────────────────────────────
  async logout() {
    try {
      sessionStorage.removeItem('portal:user');
      await supabase.auth.signOut();
    } finally {
      window.location.href = window.location.pathname.includes('/pages/')
        ? 'login.html'
        : 'pages/login.html';
    }
  }

  async refreshSession() {
    const { error } = await supabase.auth.refreshSession();
    if (error) {
      bus.emit('auth.refresh.failed', { message: error.message || String(error) });
      return false;
    }
    return true;
  }

  beginImpersonation(targetUserId, meta = {}) {
    this._impersonation = {
      active: true,
      targetUserId,
      meta,
      startedAt: Date.now(),
    };
    bus.emit('auth.impersonation.started', { ...this._impersonation });
    return this._impersonation;
  }

  endImpersonation() {
    if (!this._impersonation?.active) return;
    const ended = { ...this._impersonation, endedAt: Date.now() };
    this._impersonation = null;
    bus.emit('auth.impersonation.ended', ended);
  }

  destroy() {
    if (typeof this._unsubscribe === 'function') {
      this._unsubscribe();
    }
    this._unsubscribe = null;
  }

  // ── Session cache ──────────────────────────────────────────────────────────
  _readCache() {
    try {
      return JSON.parse(sessionStorage.getItem('portal:user') || 'null');
    } catch { return null; }
  }

  _writeCache({ user, caso, isAdmin }) {
    try {
      sessionStorage.setItem('portal:user', JSON.stringify({
        user:    { id: user.id, email: user.email, user_metadata: user.user_metadata },
        caso:    caso ? { id: caso.id, fase: caso.fase, full_name: caso.full_name } : null,
        isAdmin,
      }));
    } catch {}
  }
}

// Singleton
export const authProvider = new AuthProvider();
export default authProvider;
