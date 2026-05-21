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
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        store.setAuth({ user: null, isAdmin: false });
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
      bus.emit('auth.changed', detail);
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
