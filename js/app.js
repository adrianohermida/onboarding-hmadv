import { Router }                    from './router.js';
import { AuthService }               from '../services/auth.js';
import { showToast }                 from '../utils/helpers.js';
import { CaseService, checkIsAdmin } from '../services/database.js';

const BASE = window.location.pathname.includes('/pages/') ? '../' : './';

const PUBLIC_PAGES = ['login', 'auth-callback'];
const SHELL_SCRIPT_ATTR = 'data-shell-page-script';
const SHELL_STYLE_ATTR = 'data-shell-page-style';
const SIDEBAR_COLLAPSED_KEY = 'portal:sidebar-collapsed';
const SHELL_SUPPRESSED_EVENT = 'shell:callback-suppressed';

let appUserDetail = null;
let shellNavInFlight = false;
let captureModuleListeners = true;
const capturedModuleListeners = [];
let activeModuleToken = 0;

const nativeDocumentAddEventListener = document.addEventListener.bind(document);
const nativeDocumentRemoveEventListener = document.removeEventListener.bind(document);
const nativeWindowAddEventListener = window.addEventListener.bind(window);
const nativeWindowRemoveEventListener = window.removeEventListener.bind(window);
const nativeSetTimeout = window.setTimeout.bind(window);
const nativeClearTimeout = window.clearTimeout.bind(window);
const nativeSetInterval = window.setInterval.bind(window);
const nativeClearInterval = window.clearInterval.bind(window);
const capturedModuleTimers = [];

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

function reportSuppressedCallback(kind, error, source = 'listener') {
  const message = error?.message || String(error || 'unknown error');
  const stack = error?.stack || '';
  const module = inferModuleFromStack(stack);
  const route = routeKeyFromModule(module);
  const detail = {
    kind,
    source,
    message,
    module,
    route,
    ts: Date.now(),
  };

  try {
    if (!Array.isArray(window.__shellSuppressedCallbacks)) {
      window.__shellSuppressedCallbacks = [];
    }
    if (!window.__shellSuppressedByRoute || typeof window.__shellSuppressedByRoute !== 'object') {
      window.__shellSuppressedByRoute = {};
    }
    window.__shellSuppressedCallbacks.push(detail);
    if (window.__shellSuppressedCallbacks.length > 20) {
      window.__shellSuppressedCallbacks.shift();
    }
    window.__shellSuppressedByRoute[route] = (window.__shellSuppressedByRoute[route] || 0) + 1;
    detail.countsByRoute = { ...window.__shellSuppressedByRoute };
    window.dispatchEvent(new CustomEvent(SHELL_SUPPRESSED_EVENT, { detail }));
  } catch (_) {}
}

function runSafely(kind, fn, ctx, args) {
  try {
    const result = fn.apply(ctx, args);
    if (result && typeof result.then === 'function' && typeof result.catch === 'function') {
      result.catch(error => {
        reportSuppressedCallback(kind, error, 'async');
        console.warn(`[shell:${kind}] async listener/timer error suppressed`, error);
      });
    }
    return result;
  } catch (error) {
    reportSuppressedCallback(kind, error, 'sync');
    console.warn(`[shell:${kind}] listener/timer error suppressed`, error);
    return undefined;
  }
}

function trackModuleListener(target, type, originalListener, listener, options) {
  if (!captureModuleListeners || typeof listener !== 'function') return;
  capturedModuleListeners.push({ target, type, originalListener, listener, options });
}

function cleanupModuleListeners() {
  while (capturedModuleListeners.length) {
    const item = capturedModuleListeners.pop();
    if (!item) continue;
    if (item.target === document) {
      nativeDocumentRemoveEventListener(item.type, item.listener, item.options);
    } else if (item.target === window) {
      nativeWindowRemoveEventListener(item.type, item.listener, item.options);
    }
  }
}

function cleanupModuleTimers() {
  while (capturedModuleTimers.length) {
    const t = capturedModuleTimers.pop();
    if (!t) continue;
    if (t.kind === 'timeout') nativeClearTimeout(t.id);
    if (t.kind === 'interval') nativeClearInterval(t.id);
  }
}

document.addEventListener = function patchedDocumentAddEventListener(type, listener, options) {
  if (!captureModuleListeners || typeof listener !== 'function') {
    nativeDocumentAddEventListener(type, listener, options);
    return;
  }

  const token = activeModuleToken;
  const wrapped = function wrappedDocumentListener(...args) {
    if (token !== activeModuleToken) return;
    return runSafely('document', listener, this, args);
  };

  nativeDocumentAddEventListener(type, wrapped, options);
  trackModuleListener(document, type, listener, wrapped, options);
};

window.addEventListener = function patchedWindowAddEventListener(type, listener, options) {
  if (!captureModuleListeners || typeof listener !== 'function') {
    nativeWindowAddEventListener(type, listener, options);
    return;
  }

  const token = activeModuleToken;
  const wrapped = function wrappedWindowListener(...args) {
    if (token !== activeModuleToken) return;
    return runSafely('window', listener, this, args);
  };

  nativeWindowAddEventListener(type, wrapped, options);
  trackModuleListener(window, type, listener, wrapped, options);
};

window.setTimeout = function patchedSetTimeout(handler, timeout, ...args) {
  if (!captureModuleListeners || typeof handler !== 'function') {
    return nativeSetTimeout(handler, timeout, ...args);
  }

  const token = activeModuleToken;
  const wrapped = (...cbArgs) => {
    if (token !== activeModuleToken) return;
    return runSafely('timeout', handler, window, cbArgs);
  };

  const id = nativeSetTimeout(wrapped, timeout, ...args);
  capturedModuleTimers.push({ kind: 'timeout', id });
  return id;
};

window.clearTimeout = function patchedClearTimeout(id) {
  return nativeClearTimeout(id);
};

window.setInterval = function patchedSetInterval(handler, timeout, ...args) {
  if (!captureModuleListeners || typeof handler !== 'function') {
    return nativeSetInterval(handler, timeout, ...args);
  }

  const token = activeModuleToken;
  const wrapped = (...cbArgs) => {
    if (token !== activeModuleToken) return;
    return runSafely('interval', handler, window, cbArgs);
  };

  const id = nativeSetInterval(wrapped, timeout, ...args);
  capturedModuleTimers.push({ kind: 'interval', id });
  return id;
};

window.clearInterval = function patchedClearInterval(id) {
  return nativeClearInterval(id);
};

window.addEventListener('unhandledrejection', event => {
  const reason = event?.reason;
  const message = reason?.message || String(reason || '');
  const stack = reason?.stack || '';
  const knownNullStyle =
    message.includes("Cannot read properties of null (reading 'style')") &&
    (stack.includes('dashboard.html') || stack.includes('loadAdminOverview'));

  if (knownNullStyle) {
    event.preventDefault();
    reportSuppressedCallback('unhandledrejection', reason, 'global');
    console.warn('[shell] stale dashboard callback rejected; suppressed', reason);
  }
});

/* ── Session cache helpers ───────────────────────── */
function getCached() {
  try { return JSON.parse(sessionStorage.getItem('portal:user') || 'null'); } catch { return null; }
}
function setCached(detail) {
  try {
    sessionStorage.setItem('portal:user', JSON.stringify({
      user: { id: detail.user.id, email: detail.user.email, user_metadata: detail.user.user_metadata },
      caso: detail.caso ? { id: detail.caso.id, fase: detail.caso.fase, full_name: detail.caso.full_name } : null,
      isAdmin: detail.isAdmin,
    }));
  } catch (_) {}
}

function toAbsoluteUrl(pathOrUrl) {
  return new URL(pathOrUrl, window.location.href).toString();
}

function isSameOrigin(url) {
  try {
    return new URL(url, window.location.href).origin === window.location.origin;
  } catch (_) {
    return false;
  }
}

function isEligibleModulePath(url) {
  try {
    const u = new URL(url, window.location.href);
    if (u.origin !== window.location.origin) return false;
    if (!u.pathname.includes('/pages/')) return false;
    const name = u.pathname.split('/').pop()?.replace('.html', '') || '';
    if (!name || PUBLIC_PAGES.includes(name)) return false;
    return true;
  } catch (_) {
    return false;
  }
}

function removeDynamicPageArtifacts() {
  document.querySelectorAll(`script[${SHELL_SCRIPT_ATTR}]`).forEach(el => el.remove());
  document.querySelectorAll(`link[${SHELL_STYLE_ATTR}]`).forEach(el => el.remove());
  document.querySelectorAll('[data-shell-dynamic="1"]').forEach(el => el.remove());
}

function markInitialStylesAsCore() {
  document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
    if (!link.hasAttribute('data-shell-core-style')) {
      link.setAttribute('data-shell-core-style', '1');
    }
  });
}

function syncPageStyles(parsedDoc, targetUrl) {
  const styles = [...parsedDoc.querySelectorAll('link[rel="stylesheet"]')]
    .map(link => toAbsoluteUrl(new URL(link.getAttribute('href') || '', targetUrl).toString()));

  styles.forEach(absHref => {
    const exists = [...document.querySelectorAll('link[rel="stylesheet"]')]
      .some(link => toAbsoluteUrl(link.href) === absHref);
    if (exists) return;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    const styleUrl = new URL(absHref, window.location.href);
    if (styleUrl.origin === window.location.origin) {
      styleUrl.searchParams.set('_shellv', String(activeModuleToken));
    }
    link.href = styleUrl.toString();
    link.setAttribute(SHELL_STYLE_ATTR, '1');
    document.head.appendChild(link);
  });
}

function syncMainContent(parsedDoc) {
  const nextMain = parsedDoc.querySelector('main.page-content');
  const currentMain = document.querySelector('main.page-content');
  if (!nextMain || !currentMain) return false;

  const clonedMain = nextMain.cloneNode(true);
  currentMain.replaceWith(clonedMain);

  const nextFooter = parsedDoc.querySelector('.portal-page-footer');
  const currentFooter = document.querySelector('.portal-page-footer');
  if (nextFooter && currentFooter) {
    currentFooter.replaceWith(nextFooter.cloneNode(true));
  }

  document.querySelectorAll('.fd-save-bar, .fd-modal-backdrop, .doc-drawer-backdrop').forEach(node => node.remove());
  parsedDoc.querySelectorAll('.fd-save-bar, .fd-modal-backdrop, .doc-drawer-backdrop').forEach(node => {
    const clone = node.cloneNode(true);
    clone.setAttribute('data-shell-dynamic', '1');
    document.body.appendChild(clone);
  });

  parsedDoc.querySelectorAll('.modal-overlay, .toast').forEach(node => {
    const clone = node.cloneNode(true);
    clone.setAttribute('data-shell-dynamic', '1');
    document.body.appendChild(clone);
  });

  return true;
}

async function runPageScripts(parsedDoc, targetUrl) {
  activeModuleToken += 1;
  cleanupModuleListeners();
  cleanupModuleTimers();
  captureModuleListeners = true;

  const scripts = [...parsedDoc.querySelectorAll('script')]
    .filter(s => {
      const type = (s.getAttribute('type') || '').trim();
      const src = s.getAttribute('src') || '';
      if (src) {
        try {
          const srcUrl = new URL(src, targetUrl);
          if (srcUrl.pathname.endsWith('/js/app.js')) return false;
        } catch (_) {
          if (src.includes('/js/app.js') || src.includes('js/app.js')) return false;
        }
      }
      if (!type || type === 'text/javascript' || type === 'application/javascript' || type === 'module') {
        return true;
      }
      return false;
    });

  for (const script of scripts) {
    const el = document.createElement('script');
    el.setAttribute(SHELL_SCRIPT_ATTR, '1');

    const type = (script.getAttribute('type') || '').trim();
    if (type === 'module') {
      el.type = 'module';
    } else if (type) {
      el.type = type;
    }

    const src = script.getAttribute('src');
    if (src) {
      const scriptUrl = new URL(src, targetUrl);
      if (scriptUrl.origin === window.location.origin) {
        scriptUrl.searchParams.set('_shellv', String(activeModuleToken));
      }
      el.src = scriptUrl.toString();
    } else {
      el.textContent = script.textContent || '';
    }

    document.body.appendChild(el);
    if (el.src) {
      await new Promise(resolve => {
        el.addEventListener('load', resolve, { once: true });
        el.addEventListener('error', resolve, { once: true });
      });
    }
  }

  captureModuleListeners = false;
}

async function navigateModule(url, { pushState = true } = {}) {
  if (shellNavInFlight) return;
  shellNavInFlight = true;

  const absolute = toAbsoluteUrl(url);

  try {
    document.dispatchEvent(new CustomEvent('app:route-will-change'));

    const fetchUrl = new URL(absolute, window.location.href);
    fetchUrl.searchParams.set('_shellv', String(Date.now()));

    const res = await fetch(fetchUrl.toString(), {
      credentials: 'same-origin',
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
      },
    });
    if (!res.ok) {
      window.location.href = absolute;
      return;
    }

    const html = await res.text();
    const parsedDoc = new DOMParser().parseFromString(html, 'text/html');

    removeDynamicPageArtifacts();
    syncPageStyles(parsedDoc, absolute);
    const swapped = syncMainContent(parsedDoc);
    if (!swapped) {
      window.location.href = absolute;
      return;
    }

    await runPageScripts(parsedDoc, absolute);

    document.title = parsedDoc.title || document.title;
    if (pushState) {
      window.history.pushState({ shell: true }, '', absolute);
    }

    initRouter();
    initToast();
    initModalClose();

    if (appUserDetail) {
      document.dispatchEvent(new CustomEvent('app:user-loaded', { detail: appUserDetail }));
    }
    document.dispatchEvent(new CustomEvent('app:ready'));
    document.dispatchEvent(new CustomEvent('app:route-changed'));
  } catch (_) {
    window.location.href = absolute;
  } finally {
    shellNavInFlight = false;
  }
}

function setupShellNavigation() {
  markInitialStylesAsCore();

  document.addEventListener('click', event => {
    const link = event.target?.closest?.('a[href]');
    if (!link) return;
    if (link.target === '_blank' || link.hasAttribute('download')) return;

    const href = link.getAttribute('href');
    if (!href || href.startsWith('#')) return;

    const absolute = toAbsoluteUrl(href);
    if (!isSameOrigin(absolute) || !isEligibleModulePath(absolute)) return;

    event.preventDefault();
    navigateModule(absolute, { pushState: true });
  });

  window.addEventListener('popstate', () => {
    if (!isEligibleModulePath(window.location.href)) return;
    navigateModule(window.location.href, { pushState: false });
  });
}

/* ── Sidebar / Header update (scripts don't run via innerHTML) ─── */
function updateSidebarUser(user, caso, isAdmin) {
  const emailEl  = document.getElementById('sidebar-user-email');
  const statusEl = document.getElementById('sidebar-case-status');
  if (emailEl)  emailEl.textContent  = user?.email || '';
  if (statusEl) statusEl.textContent = isAdmin
    ? 'Administrador'
    : (caso?.fase || 'Cadastro');
}

function updateHeaderUser(user) {
  const nameEl   = document.getElementById('header-user-name');
  const avatarEl = document.getElementById('header-avatar');
  if (!user) return;
  const email    = user.email || '';
  const display  = user.user_metadata?.full_name || email;
  const initials = email.substring(0, 2).toUpperCase();
  if (nameEl)   { nameEl.textContent = display; nameEl.style.display = ''; }
  if (avatarEl)   avatarEl.textContent = initials;
}

function setupSidebarMobile() {
  const toggle = document.getElementById('sidebar-toggle');
  const shell = document.querySelector('.portal-shell');
  const sidebar = document.querySelector('.sidebar');
  if (!toggle || !sidebar || !shell) return;

  let overlay = document.getElementById('sidebar-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'sidebar-overlay';
    document.body.appendChild(overlay);
  }

  const isMobile = () => window.matchMedia('(max-width: 1023px)').matches;

  const closeSidebar = () => {
    sidebar.classList.remove('sidebar-open');
    overlay.classList.remove('visible');
    document.body.style.overflow = '';
    toggle.setAttribute('aria-expanded', 'false');
  };

  const openSidebar = () => {
    sidebar.classList.add('sidebar-open');
    overlay.classList.add('visible');
    document.body.style.overflow = 'hidden';
    toggle.setAttribute('aria-expanded', 'true');
  };

  const setDesktopCollapsed = (collapsed) => {
    shell.classList.toggle('sidebar-collapsed', collapsed);
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? '1' : '0');
    } catch (_) {}
    toggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    toggle.setAttribute('title', collapsed ? 'Expandir menu' : 'Recolher menu');
  };

  const getDesktopCollapsed = () => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1';
    } catch (_) {
      return false;
    }
  };

  const syncForViewport = () => {
    if (isMobile()) {
      closeSidebar();
      shell.classList.remove('sidebar-collapsed');
      toggle.setAttribute('title', 'Abrir menu');
      return;
    }
    closeSidebar();
    setDesktopCollapsed(getDesktopCollapsed());
  };

  toggle.addEventListener('click', e => {
    e.stopPropagation();
    if (isMobile()) {
      if (sidebar.classList.contains('sidebar-open')) closeSidebar();
      else openSidebar();
      return;
    }

    const collapsed = shell.classList.contains('sidebar-collapsed');
    setDesktopCollapsed(!collapsed);
  });

  overlay.addEventListener('click', closeSidebar);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeSidebar();
  });
  document.addEventListener('app:route-changed', () => {
    if (isMobile()) closeSidebar();
  });

  // Touch swipe-left to close on mobile
  let touchStartX = 0;
  sidebar.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  sidebar.addEventListener('touchend', e => {
    if (!isMobile()) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (dx < -60) closeSidebar();
  }, { passive: true });

  window.addEventListener('resize', syncForViewport);
  syncForViewport();
}

/* ── Page guard ──────────────────────────────────── */
function getCurrentPage() {
  return window.location.pathname.split('/').pop().replace('.html', '') || 'index';
}

async function guardAuth() {
  const page = getCurrentPage();
  if (PUBLIC_PAGES.includes(page)) return true;
  const authenticated = await AuthService.isAuthenticated();
  if (!authenticated) {
    const base = window.location.pathname.includes('/pages/') ? '' : 'pages/';
    window.location.replace(base + 'login.html');
    return false;
  }
  return true;
}

/* ── Component loading ───────────────────────────── */
async function loadComponent(selector, path) {
  const el = document.querySelector(selector);
  if (!el) return;
  try {
    const res = await fetch(BASE + path);
    if (!res.ok) throw new Error(res.status);
    el.innerHTML = await res.text();
  } catch (e) {
    console.warn('[APP] Component load failed:', path, e);
  }
}

async function loadComponents() {
  // Pre-populate from cache for instant render
  const cached = getCached();
  if (cached?.user) {
    updateSidebarUser(cached.user, cached.caso, cached.isAdmin);
    updateHeaderUser(cached.user);
  }

  await Promise.all([
    loadComponent('[data-component="sidebar"]', 'components/sidebar.html'),
    loadComponent('[data-component="header"]',  'components/header.html'),
  ]);

  // Wire up interactions (scripts in injected HTML don't execute via innerHTML)
  window.handleLogout = () => {
    try { sessionStorage.removeItem('portal:user'); } catch (_) {}
    AuthService.logout();
  };

  setupSidebarMobile();

  // Restore from cache after HTML injection
  if (cached?.user) {
    updateSidebarUser(cached.user, cached.caso, cached.isAdmin);
    updateHeaderUser(cached.user);
  }
}

/* ── User loading ────────────────────────────────── */
async function loadUser() {
  const user = await AuthService.getUser();
  if (!user) return;

  const isAdmin = await checkIsAdmin().catch(() => false);

  if (!isAdmin) {
    try { await CaseService.ensureExists(); } catch (_) {}
  }
  const caso = isAdmin ? null : await CaseService.get().catch(() => null);

  const detail = { user, caso, isAdmin };
  appUserDetail = detail;

  // Update UI immediately
  updateSidebarUser(user, caso, isAdmin);
  updateHeaderUser(user);

  // Cache for next navigation (instant pre-population)
  setCached(detail);

  document.dispatchEvent(new CustomEvent('app:user-loaded', { detail }));
}

/* ── Router ──────────────────────────────────────── */
function initRouter() {
  const router = new Router();
  router.setActiveLink();
  router.updateBreadcrumb();

  // Update header title from breadcrumb
  const breadcrumb = document.getElementById('header-breadcrumb');
  const titleEl    = document.getElementById('header-page-title');
  if (breadcrumb && titleEl) {
    const strong = breadcrumb.querySelector('strong');
    if (strong) titleEl.textContent = strong.textContent;
  }
}

function initToast() {
  if (!document.getElementById('toast')) {
    const el = document.createElement('div');
    el.className = 'toast'; el.id = 'toast';
    el.innerHTML = '<span id="toast-msg"></span>';
    document.body.appendChild(el);
  }
}

function initModalClose() {
  document.querySelectorAll('[data-modal-close]').forEach(btn => {
    if (btn.dataset.modalBound === '1') return;
    btn.dataset.modalBound = '1';
    btn.addEventListener('click', () => {
      document.getElementById(btn.dataset.modalClose)?.classList.remove('show');
    });
  });
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    if (overlay.dataset.modalOverlayBound === '1') return;
    overlay.dataset.modalOverlayBound = '1';
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.classList.remove('show');
    });
  });
}

/* ── Init ────────────────────────────────────────── */
async function init() {
  captureModuleListeners = false;

  const allowed = await guardAuth();
  if (!allowed) return;

  await loadComponents();
  await loadUser();
  setupShellNavigation();

  initRouter();
  initToast();
  setTimeout(initModalClose, 100);

  window.showToast = showToast;
  document.dispatchEvent(new CustomEvent('app:ready'));

  // Reveal page after everything loaded (removes skeleton shimmer)
  document.body.classList.add('app-loaded');
}

nativeDocumentAddEventListener('DOMContentLoaded', init);
