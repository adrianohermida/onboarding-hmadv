/**
 * AuthenticatedShell — the top-level shell orchestrator.
 *
 * Replaces the ad-hoc init() in app.js with a proper lifecycle:
 *
 *   1. TenantProvider.init()     — branding + feature flags
 *   2. AuthProvider.init()       — session hydration + guards
 *   3. ModuleRegistry.init()     — discover modules
 *   4. loadComponents()          — inject sidebar + header HTML
 *   5. mount sub-systems:
 *        LoadingLayer, ModalRoot, SlideoverRoot, NotificationCenter
 *   6. bindNavigation()          — shell navigation + history
 *   7. Observability.init()      — error tracking + performance
 *   8. Emit 'shell.ready'        — modules can now boot
 *
 * This file is the ONLY place that knows about all shell subsystems.
 * Modules talk to the shell via ShellContract only.
 */
import { store }               from './state/ShellStore.js';
import { authProvider }        from './auth/AuthProvider.js';
import { moduleRegistry }      from './module-registry/ModuleRegistry.js';
import { globalModal }         from './modals/GlobalModalRoot.js';
import { globalSlideover }     from './slideovers/SlideoverRoot.js';
import { notificationCenter }  from './notifications/NotificationCenter.js';
import { loadingLayer }        from './layout/GlobalLoadingLayer.js';
import { globalErrorBoundary } from './layout/GlobalErrorBoundary.js';
import { SuspenseBoundary }    from './layout/SuspenseBoundary.js';
import { obs }                 from './observability/Observability.js';
import { shellProviders }      from './providers/ShellProviders.js';
import { routeGuards }         from './guards/RouteGuards.js';
import { responsiveService }   from './responsive/ResponsiveService.js';
import { shellAnalytics }      from './analytics/ShellAnalytics.js';
import { bus }                 from '../modules/events/EventBus.js';

export class AuthenticatedShell {
  constructor(opts = {}) {
    this._opts = {
      publicPages:  opts.publicPages  || ['login', 'auth-callback'],
      componentBase:opts.componentBase || (window.location.pathname.includes('/pages/') ? '../' : './'),
    };
    this._booted = false;
    this._suspenseBoundary = null;
  }

  // ── Boot ──────────────────────────────────────────────────────────────────
  async boot() {
    if (this._booted) return;
    this._booted = true;

    obs.init();
    globalErrorBoundary.mount();
    shellAnalytics.init();
    loadingLayer.mount();
    loadingLayer.start();

    try {
      const { auth: authDetail } = await shellProviders.init();
      await this._loadComponents();

      if (!authDetail) {
        const page = this._getCurrentPage();
        if (!this._opts.publicPages.includes(page)) {
          authProvider.requireAuth();
          return;
        }
      }

      moduleRegistry.init();

      // Mount shell subsystems
      globalModal.mount();
      globalSlideover.mount();
      notificationCenter.mount('.header-actions');

      // Sidebar collapse state
      this._initSidebar();
      responsiveService.bind();

      // Shell navigation (intercept clicks, history)
      this._bindShellNavigation();

      // Emit auth detail to pages that use 'app:user-loaded'
      if (authDetail) {
        this._updateSidebarUser(authDetail);
        this._updateHeaderUser(authDetail);
        document.dispatchEvent(new CustomEvent('app:user-loaded', { detail: authDetail }));
      }

      loadingLayer.finish();
      document.body.classList.add('app-loaded');
      document.dispatchEvent(new CustomEvent('app:ready'));
      bus.emit('shell.ready', { authDetail });

    } catch (err) {
      obs.error('Shell boot failed', { err: String(err) });
      loadingLayer.error();
      console.error('[Shell] boot error:', err);
    }
  }

  // ── Components ────────────────────────────────────────────────────────────
  async _loadComponents() {
    const base = this._opts.componentBase;
    await Promise.all([
      this._injectComponent('[data-component="sidebar"]', `${base}components/sidebar.html`),
      this._injectComponent('[data-component="header"]',  `${base}components/header.html`),
    ]);
    // Wire logout after injection
    window.handleLogout = () => authProvider.logout();
  }

  async _injectComponent(selector, path) {
    const el = document.querySelector(selector);
    if (!el) return;
    try {
      const res = await fetch(path);
      if (!res.ok) throw new Error(res.status);
      el.innerHTML = await res.text();
    } catch (e) {
      console.warn('[Shell] Component load failed:', path, e);
    }
  }

  // ── Sidebar ───────────────────────────────────────────────────────────────
  _initSidebar() {
    const shell   = document.querySelector('.portal-shell');
    const sidebar = document.querySelector('.sidebar');
    const toggle  = document.getElementById('sidebar-toggle');
    if (!shell || !sidebar || !toggle) return;

    // Restore collapsed state
    const { collapsed } = store.get('sidebar');
    if (collapsed) shell.classList.add('sidebar-collapsed');

    const isMobile = () => window.matchMedia('(max-width: 1023px)').matches;

    // Toggle button
    toggle.addEventListener('click', e => {
      e.stopPropagation();
      if (isMobile()) {
        const isOpen = store.get('sidebar').open;
        store.setSidebarOpen(!isOpen);
      } else {
        store.toggleSidebarCollapsed();
        toggle.setAttribute('title', store.get('sidebar').collapsed ? 'Expandir menu' : 'Recolher menu');
      }
    });

    // Overlay click
    document.getElementById('sidebar-overlay')?.addEventListener('click', () => store.setSidebarOpen(false));

    // ESC
    document.addEventListener('keydown', e => { if (e.key === 'Escape') store.setSidebarOpen(false); });

    // Route change → close mobile drawer
    document.addEventListener('app:route-changed', () => { if (isMobile()) store.setSidebarOpen(false); });

    // Resize
    window.addEventListener('resize', () => {
      if (!isMobile()) store.setSidebarOpen(false);
    });

    // Swipe to close
    let tx = 0;
    sidebar.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
    sidebar.addEventListener('touchend',   e => {
      if (!isMobile()) return;
      if (e.changedTouches[0].clientX - tx < -60) store.setSidebarOpen(false);
    }, { passive: true });
  }

  // ── Shell Navigation ──────────────────────────────────────────────────────
  _bindShellNavigation() {
    // Active link marking
    this._markActiveLink();

    document.addEventListener('click', e => {
      const link = e.target?.closest?.('a[href]');
      if (!link) return;
      if (link.target === '_blank' || link.hasAttribute('download')) return;
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#')) return;
      const abs = new URL(href, window.location.href);
      if (abs.origin !== window.location.origin) return;
      if (!abs.pathname.includes('/pages/')) return;
      const name = abs.pathname.split('/').pop()?.replace('.html', '') || '';
      if (['login', 'auth-callback'].includes(name)) return;

      e.preventDefault();
      this._navigate(abs.toString());
    });

    window.addEventListener('popstate', () => {
      const href = window.location.href;
      if (href.includes('/pages/')) this._navigate(href, false);
    });
  }

  async _navigate(url, pushState = true) {
    if (!routeGuards.canAccessRoute(url)) {
      obs.authFailure('route_access_denied');
      return;
    }

    const module = moduleRegistry.getByRoute(url);
    if (module?.lazy) {
      await moduleRegistry.preload(module.key);
    }

    obs.routeStart(url);
    store.setRouteLoading(true);
    loadingLayer.start();
    this._suspenseBoundary = this._suspenseBoundary || new SuspenseBoundary(document.querySelector('.portal-shell'));
    this._suspenseBoundary.show();

    try {
      const fetchUrl = new URL(url, window.location.href);
      fetchUrl.searchParams.set('_v', String(Date.now()));

      const res = await fetch(fetchUrl.toString(), {
        credentials: 'same-origin',
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store' },
      });

      if (!res.ok) { window.location.href = url; return; }

      const html = await res.text();
      const doc  = new DOMParser().parseFromString(html, 'text/html');

      // Swap main content
      const nextMain = doc.querySelector('main.page-content');
      const curMain  = document.querySelector('main.page-content');
      if (!nextMain || !curMain) { window.location.href = url; return; }

      // Sync stylesheets
      [...doc.querySelectorAll('link[rel="stylesheet"]')].forEach(link => {
        const abs = new URL(link.getAttribute('href') || '', url).toString();
        if (![...document.querySelectorAll('link[rel="stylesheet"]')].some(l => l.href === abs)) {
          const el = document.createElement('link');
          el.rel = 'stylesheet'; el.href = abs;
          el.setAttribute('data-shell-page-style', '1');
          document.head.appendChild(el);
        }
      });

      // Swap footer
      document.querySelectorAll('[data-shell-dynamic]').forEach(el => el.remove());
      const nextFooter = doc.querySelector('.portal-page-footer');
      if (nextFooter) {
        const cur = document.querySelector('.portal-page-footer');
        if (cur) cur.replaceWith(nextFooter.cloneNode(true));
      }

      curMain.replaceWith(nextMain.cloneNode(true));

      // Run page scripts
      await this._runScripts(doc, url);

      if (pushState) window.history.pushState({ shell: true }, '', url);

      document.title = doc.title || document.title;
      this._markActiveLink();
      this._updateBreadcrumb();

      store.setCurrentRoute(url);
      obs.routeEnd(url);
      loadingLayer.finish();
      this._suspenseBoundary?.hide();

      if (store.get('auth')) {
        document.dispatchEvent(new CustomEvent('app:user-loaded', { detail: store.get('auth') }));
      }
      document.dispatchEvent(new CustomEvent('app:ready'));
      document.dispatchEvent(new CustomEvent('app:route-changed'));

    } catch (err) {
      obs.error('Navigation failed', { url, err: String(err) });
      loadingLayer.error();
      this._suspenseBoundary?.hide();
      window.location.href = url;
    } finally {
      store.setRouteLoading(false);
    }
  }

  async _runScripts(doc, baseUrl) {
    const scripts = [...doc.querySelectorAll('script')].filter(s => {
      const src = s.getAttribute('src') || '';
      return !src.includes('/js/app.js');
    });
    for (const s of scripts) {
      const el = document.createElement('script');
      el.setAttribute('data-shell-page-script', '1');
      if (s.type) el.type = s.type;
      const src = s.getAttribute('src');
      if (src) {
        const u = new URL(src, baseUrl);
        u.searchParams.set('_v', String(Date.now()));
        el.src = u.toString();
        document.querySelectorAll(`script[data-shell-page-script]`).forEach(n => n.remove());
        document.body.appendChild(el);
        await new Promise(r => { el.onload = r; el.onerror = r; });
      } else {
        el.textContent = s.textContent;
        document.body.appendChild(el);
      }
    }
  }

  // ── UI helpers ────────────────────────────────────────────────────────────
  _getCurrentPage() {
    return window.location.pathname.split('/').pop().replace('.html', '') || 'dashboard';
  }

  _markActiveLink() {
    const current = this._getCurrentPage();
    document.querySelectorAll('.nav-link').forEach(link => {
      const href = link.getAttribute('href') || '';
      const name = link.dataset.page || href.replace('.html', '').split('/').pop();
      link.classList.toggle('active', name === current);
      if (name === current) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }

  _updateBreadcrumb() {
    const current = this._getCurrentPage();
    const mod     = moduleRegistry.get(current);
    if (!mod) return;
    const el = document.querySelector('.header-breadcrumb');
    if (el) {
      el.innerHTML = mod.parent
        ? `<span>${mod.parent}</span> <span style="opacity:.4">/</span> <strong>${mod.title}</strong>`
        : `<strong>${mod.title}</strong>`;
    }
    const titleEl = document.getElementById('header-page-title');
    if (titleEl) titleEl.textContent = mod.title;
  }

  _updateSidebarUser({ user, caso, isAdmin }) {
    const emailEl  = document.getElementById('sidebar-user-email');
    const statusEl = document.getElementById('sidebar-case-status');
    if (emailEl)  emailEl.textContent  = user?.email || '';
    if (statusEl) statusEl.textContent = isAdmin ? 'Administrador' : (caso?.fase || 'Cadastro');
  }

  _updateHeaderUser({ user }) {
    if (!user) return;
    const nameEl   = document.getElementById('header-user-name');
    const avatarEl = document.getElementById('header-avatar');
    const email    = user.email || '';
    const display  = user.user_metadata?.full_name || email;
    const initials = email.substring(0, 2).toUpperCase();
    if (nameEl)   { nameEl.textContent = display; nameEl.style.display = ''; }
    if (avatarEl)   avatarEl.textContent = initials;
  }
}

// Singleton
export const authenticatedShell = new AuthenticatedShell();
export default authenticatedShell;
