/**
 * ShellStore — reactive global state for the portal shell.
 *
 * Tiny reactive store using EventTarget.
 * Modules MUST NOT import this directly — use shell/contracts instead.
 *
 * Shape:
 *   sidebar   : { collapsed: bool, open: bool }
 *   auth      : { user, isAdmin, loaded }
 *   tenant    : { id, name, branding }
 *   modals    : { stack: [] }
 *   slideovers: { stack: [] }
 *   notifications: { items: [], unreadCount: 0 }
 *   billing   : { subscription, usage, quotas, entitlements, cost, economics }
 *   route     : { current, previous, loading }
 *   viewMode  : 'cliente' | 'advogado' | 'admin'
 */

const SIDEBAR_KEY = 'portal:sidebar-collapsed';

const _initialState = () => ({
  sidebar: {
    collapsed: _readSidebarPref(),
    open:      false,   // mobile overlay open
  },
  auth: {
    user:    null,
    isAdmin: false,
    loaded:  false,
  },
  tenant: {
    id:       'hmadv',
    name:     'Hermida Maia Advocacia',
    branding: { primary: '#1A3A5C', accent: '#F5A623' },
  },
  modals:    { stack: [] },
  slideovers:{ stack: [] },
  notifications: { items: [], unreadCount: 0 },
  billing: {
    subscription: null,
    usage: {},
    quotas: {},
    entitlements: null,
    cost: null,
    economics: null,
  },
  route: { current: null, previous: null, loading: false },
  viewMode: 'cliente',
});

function _readSidebarPref() {
  try { return localStorage.getItem(SIDEBAR_KEY) === '1'; } catch { return false; }
}

function _writeSidebarPref(val) {
  try { localStorage.setItem(SIDEBAR_KEY, val ? '1' : '0'); } catch {}
}

class ShellStore extends EventTarget {
  constructor() {
    super();
    this._state = _initialState();
  }

  // ── Read ────────────────────────────────────────────────────────────────────
  getState() { return this._state; }
  get(key)   { return this._state[key]; }

  // ── Write ───────────────────────────────────────────────────────────────────
  _set(slice, patch) {
    const prev = this._state[slice];
    this._state[slice] = typeof prev === 'object' && !Array.isArray(prev)
      ? { ...prev, ...patch }
      : patch;
    this.dispatchEvent(new CustomEvent('change', {
      detail: { slice, state: this._state[slice], prev },
    }));
    this.dispatchEvent(new CustomEvent(`change:${slice}`, {
      detail: { state: this._state[slice], prev },
    }));
  }

  // ── Sidebar ─────────────────────────────────────────────────────────────────
  setSidebarCollapsed(val) {
    this._set('sidebar', { collapsed: val });
    _writeSidebarPref(val);
    document.querySelector('.portal-shell')?.classList.toggle('sidebar-collapsed', val);
  }

  toggleSidebarCollapsed() {
    this.setSidebarCollapsed(!this._state.sidebar.collapsed);
  }

  setSidebarOpen(val) {
    this._set('sidebar', { open: val });
    document.querySelector('.sidebar')?.classList.toggle('sidebar-open', val);
    const overlay = document.getElementById('sidebar-overlay');
    if (overlay) overlay.classList.toggle('visible', val);
    document.body.style.overflow = val ? 'hidden' : '';
  }

  // ── Auth ────────────────────────────────────────────────────────────────────
  setAuth({ user, isAdmin }) {
    this._set('auth', { user, isAdmin, loaded: true });
  }

  // ── ViewMode ─────────────────────────────────────────────────────────────────
  setViewMode(mode) {
    if (!['cliente', 'advogado', 'admin'].includes(mode)) return;
    this._state.viewMode = mode;
    this.dispatchEvent(new CustomEvent('change:viewMode', { detail: { mode } }));
    document.dispatchEvent(new CustomEvent('shell:viewmode-changed', { detail: { mode } }));
  }

  getViewMode() { return this._state.viewMode; }

  // ── Route ───────────────────────────────────────────────────────────────────
  setRouteLoading(val) { this._set('route', { loading: val }); }
  setCurrentRoute(path) {
    this._set('route', { previous: this._state.route.current, current: path, loading: false });
  }

  // ── Notifications ────────────────────────────────────────────────────────────
  addNotification(item) {
    const items = [{ ...item, id: item.id || Date.now(), read: false }, ...this._state.notifications.items];
    const unreadCount = items.filter(n => !n.read).length;
    this._set('notifications', { items, unreadCount });
  }

  markNotificationsRead() {
    const items = this._state.notifications.items.map(n => ({ ...n, read: true }));
    this._set('notifications', { items, unreadCount: 0 });
  }

  // ── Billing ─────────────────────────────────────────────────────────────────
  setBillingSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== 'object') return;
    this._set('billing', {
      subscription: snapshot.subscription || null,
      usage: snapshot.usage || {},
      quotas: snapshot.quotas || {},
      entitlements: snapshot.entitlements || null,
      cost: snapshot.cost || null,
      economics: snapshot.economics || null,
      generated_at: snapshot.generated_at || new Date().toISOString(),
    });
  }

  // ── Subscribe ────────────────────────────────────────────────────────────────
  subscribe(sliceOrAll, handler) {
    const event = sliceOrAll === '*' ? 'change' : `change:${sliceOrAll}`;
    this.addEventListener(event, handler);
    return () => this.removeEventListener(event, handler);
  }
}

// Singleton
export const store = new ShellStore();
export default store;
