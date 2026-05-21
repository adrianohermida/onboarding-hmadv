import { Router }                    from './router.js';
import { getSidebarModules as getCanonicalSidebarModules } from './navigation.js';
import { installRuntimeIsolation }   from './shell-runtime-isolation.js';
import { AuthService }               from '../services/auth.js';
import { showToast }                 from '../utils/helpers.js';
import { CaseService, checkIsAdmin } from '../services/database.js';
import { bus }                       from '../modules/events/EventBus.js';

const BASE = window.location.pathname.includes('/pages/') ? '../' : './';

const PUBLIC_PAGES = ['login', 'auth-callback'];
const SHELL_SCRIPT_ATTR = 'data-shell-page-script';
const SHELL_STYLE_ATTR = 'data-shell-page-style';
const SIDEBAR_COLLAPSED_KEY = 'portal:sidebar-collapsed';
const VIEW_MODE_KEY = 'portal:view-mode';
const VIEW_MODE_EVENT = 'portal:view-mode-changed';
const SHELL_SUPPRESSED_EVENT = 'shell:callback-suppressed';
const SHELL_SERVICE_ERROR_EVENT = 'portal:service-error';
const SHELL_VERSION = '20260521l';
const SHELL_TELEMETRY_MAX = 100;
const SHELL_TELEMETRY_SAMPLE_RATE = 0.6;
const SHELL_TELEMETRY_MAX_PER_ROUTE = 24;
const SHELL_SERVICE_ERRORS_MAX = 80;
const FRESHCHAT_SCRIPT_ID = 'freshchat-private-widget';
const FRESHCHAT_SCRIPT_SRC = 'https://wchat.freshchat.com/js/widget.js';
const FRESHCHAT_WIDGET_TOKEN = '252eab20-7dcb-432e-ae72-7a011bfef8de';
const FRESHCHAT_WIDGET_HOST = 'https://wchat.freshchat.com';
const FRESHCHAT_VISIBLE_STYLE_ID = 'freshchat-shell-persistence-style';
const FRESHCHAT_WATCHDOG_INTERVAL_MS = 5000;

window.__shellVersion = SHELL_VERSION;

let appUserDetail = null;
let shellNavInFlight = false;
let captureModuleListeners = true;
let runtimeIsolationEnabled = window.location.pathname.includes('/pages/');
let activeModuleToken = 0;
const portalViewModeSubscribers = new Set();
let shellRouteFailure = null;
let serviceErrorBannerListenerBound = false;
let unmountShellModeSelector = null;
let freshchatWatchdogTimer = null;

function normalizeViewMode(mode) {
  return mode === 'admin' ? 'admin' : 'cliente';
}

function getStoredViewMode() {
  try {
    return normalizeViewMode(sessionStorage.getItem(VIEW_MODE_KEY) || 'cliente');
  } catch (_) {
    return 'cliente';
  }
}

function setStoredViewMode(mode) {
  try {
    sessionStorage.setItem(VIEW_MODE_KEY, normalizeViewMode(mode));
  } catch (_) {}
}

function notifyViewModeSubscribers(mode, meta = {}) {
  portalViewModeSubscribers.forEach(cb => {
    try { cb(mode, meta); } catch (_) {}
  });
}

function setPortalViewMode(mode, { source = 'app', persist = true, emit = true } = {}) {
  const next = normalizeViewMode(mode);
  const prev = getStoredViewMode();
  if (prev === next) {
    if (persist) setStoredViewMode(next);
    return next;
  }
  if (persist) setStoredViewMode(next);
  if (!emit) return next;

  const detail = { mode: next, source, prevMode: prev };
  notifyViewModeSubscribers(next, detail);
  try {
    window.dispatchEvent(new CustomEvent(VIEW_MODE_EVENT, { detail }));
  } catch (_) {}
  return next;
}

function mountPortalViewModeSelector(containerOrId, options = {}) {
  const container = typeof containerOrId === 'string'
    ? document.getElementById(containerOrId)
    : containerOrId;
  if (!container) return () => {};

  const shellSelector = document.getElementById('shell-mode-selector');
  if (shellSelector && container.id !== 'shell-mode-selector') {
    container.innerHTML = '';
    container.hidden = true;
    return () => {};
  }

  const {
    label = 'Modo de visualizacao:',
    adminLabel = 'Administrador',
    clientLabel = 'Cliente',
    onChange = null,
  } = options;

  container.innerHTML = `
    <div class="portal-mode-switch">
      <span class="portal-mode-switch-label">${label}</span>
      <div class="portal-mode-switch-btns" role="tablist" aria-label="Modo de visualizacao">
        <button type="button" class="portal-mode-btn" data-mode="admin" role="tab">${adminLabel}</button>
        <button type="button" class="portal-mode-btn" data-mode="cliente" role="tab">${clientLabel}</button>
      </div>
    </div>
  `;

  const buttons = [...container.querySelectorAll('.portal-mode-btn')];

  const apply = (mode) => {
    const normalized = normalizeViewMode(mode);
    buttons.forEach(btn => {
      const active = btn.dataset.mode === normalized;
      btn.classList.toggle('portal-mode-btn-active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    if (typeof onChange === 'function') onChange(normalized);
  };

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      setPortalViewMode(btn.dataset.mode || 'cliente', { source: 'selector-click' });
    });
  });

  const subscriber = (mode) => apply(mode);
  portalViewModeSubscribers.add(subscriber);
  apply(getStoredViewMode());

  return () => {
    portalViewModeSubscribers.delete(subscriber);
  };
}

window.getPortalViewMode = () => getStoredViewMode();
window.setPortalViewMode = (mode, options = {}) => setPortalViewMode(mode, options);
window.onPortalViewModeChange = (cb) => {
  if (typeof cb !== 'function') return () => {};
  portalViewModeSubscribers.add(cb);
  return () => portalViewModeSubscribers.delete(cb);
};
window.mountPortalViewModeSelector = (containerOrId, options = {}) =>
  mountPortalViewModeSelector(containerOrId, options);

const runtimeIsolation = installRuntimeIsolation({
  isEnabled: () => runtimeIsolationEnabled,
  isCaptureEnabled: () => captureModuleListeners,
  getActiveToken: () => activeModuleToken,
  eventName: SHELL_SUPPRESSED_EVENT,
  telemetry: {
    sampleRate: SHELL_TELEMETRY_SAMPLE_RATE,
    maxEvents: SHELL_TELEMETRY_MAX,
    maxPerRoute: SHELL_TELEMETRY_MAX_PER_ROUTE,
  },
});

window.addEventListener('unhandledrejection', event => {
  const reason = event?.reason;
  const message = reason?.message || String(reason || '');
  const stack = reason?.stack || '';
  const knownNullStyle =
    message.includes("Cannot read properties of null (reading 'style')") &&
    (stack.includes('dashboard.html') || stack.includes('loadAdminOverview'));

  if (knownNullStyle) {
    event.preventDefault();
    runtimeIsolation.reportSuppressed('unhandledrejection', reason, 'global');
    console.warn('[shell] stale dashboard callback rejected; suppressed', reason);
  }
});

const nativeDocumentAddEventListener = runtimeIsolation.nativeDocumentAddEventListener;
const nativeWindowAddEventListener = runtimeIsolation.nativeWindowAddEventListener;

function resetRouteFailure() {
  shellRouteFailure = null;
  try {
    delete window.__shellRouteFailure;
  } catch (_) {}
}

function setRouteFailure(routeUrl, error) {
  const detail = {
    routeUrl,
    message: error?.message || String(error || 'unknown error'),
    ts: Date.now(),
  };
  shellRouteFailure = detail;
  try {
    window.__shellRouteFailure = detail;
  } catch (_) {}
}

function validateShellReady() {
  const sidebarHost = document.querySelector('[data-component="sidebar"]');
  const headerHost = document.querySelector('[data-component="header"]');
  const sidebar = sidebarHost?.querySelector('.sidebar') || document.querySelector('.sidebar');
  const header = headerHost?.querySelector('.portal-header') || document.querySelector('.portal-header');
  const main = document.querySelector('main.page-content');
  const navLinks = document.querySelectorAll('#sidebar-nav-links .nav-link[data-page]');

  return Boolean(sidebar && header && main && main.children.length > 0 && navLinks.length >= 7);
}

function revealAppWhenReady() {
  const ready = validateShellReady();
  document.body.classList.toggle('app-loaded', ready);
  return ready;
}

function escapeShellHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderRouteFailureFallback(routeUrl, error) {
  setRouteFailure(routeUrl, error);

  const main = document.querySelector('main.page-content');
  if (!main) {
    window.location.href = routeUrl;
    return;
  }

  const message = escapeShellHtml(error?.message || 'Nao foi possivel carregar este modulo.');
  const safeRouteUrl = escapeShellHtml(routeUrl);
  main.innerHTML = `
    <section class="shell-route-fallback" role="alert" aria-live="polite">
      <div class="shell-route-fallback-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M12 9v4m0 4h.01M10.3 4.3 2.8 17.2A2 2 0 0 0 4.5 20h15a2 2 0 0 0 1.7-2.8L13.7 4.3a2 2 0 0 0-3.4 0Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div class="shell-route-fallback-copy">
        <h1>Modulo indisponivel</h1>
        <p>${message}</p>
      </div>
      <div class="shell-route-fallback-actions">
        <button type="button" class="btn btn-primary" data-shell-action="reload-route">Recarregar</button>
        <a class="btn btn-ghost" href="${safeRouteUrl}">Abrir rota</a>
      </div>
    </section>
  `;

  initRouter();
  initToast();
  document.dispatchEvent(new CustomEvent('app:route-changed'));
  revealAppWhenReady();
}

function getServiceErrorState() {
  if (!window.__shellServiceErrors || typeof window.__shellServiceErrors !== 'object') {
    window.__shellServiceErrors = {
      total: 0,
      byRoute: {},
      recent: [],
    };
  }
  return window.__shellServiceErrors;
}

function ensureAdminServiceErrorBanner() {
  if (!appUserDetail?.isAdmin) {
    document.getElementById('shell-service-error-banner')?.remove();
    return null;
  }

  const main = document.querySelector('main.page-content');
  if (!main) return null;

  let banner = document.getElementById('shell-service-error-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'shell-service-error-banner';
    banner.className = 'shell-service-banner';
    banner.innerHTML = `
      <div class="shell-service-banner-title">Diagnostico tecnico (admin)</div>
      <div class="shell-service-banner-text" data-role="summary"></div>
      <div class="shell-service-banner-text" data-role="latest"></div>
    `;
    main.prepend(banner);
  }

  return banner;
}

function renderAdminServiceErrorBanner() {
  const banner = ensureAdminServiceErrorBanner();
  if (!banner) return;

  const state = getServiceErrorState();
  const route = getCurrentPage();
  const routeCount = state.byRoute?.[route] || 0;
  const latest = state.recent[state.recent.length - 1] || null;

  const summaryEl = banner.querySelector('[data-role="summary"]');
  const latestEl = banner.querySelector('[data-role="latest"]');
  if (summaryEl) {
    summaryEl.textContent = `Rota atual: ${routeCount} falha(s) | Sessao: ${state.total} falha(s)`;
  }

  if (latestEl) {
    if (!latest) {
      latestEl.textContent = 'Sem falhas recentes de servico.';
    } else {
      const stage = latest.stage || 'unknown-stage';
      const path = latest.path || latest.type || 'edge';
      const message = latest.message || 'erro sem mensagem';
      latestEl.textContent = `Ultima falha: ${path} [${stage}] - ${message}`;
    }
  }
}

function setupServiceErrorBannerListener() {
  if (serviceErrorBannerListenerBound) return;
  serviceErrorBannerListenerBound = true;

  nativeWindowAddEventListener(SHELL_SERVICE_ERROR_EVENT, (event) => {
    if (!appUserDetail?.isAdmin) return;
    const detail = event?.detail || {};
    const route = getCurrentPage();
    const state = getServiceErrorState();

    state.total += 1;
    state.byRoute[route] = (state.byRoute[route] || 0) + 1;
    state.recent.push({ ...detail, route, ts: Date.now() });
    if (state.recent.length > SHELL_SERVICE_ERRORS_MAX) {
      state.recent.shift();
    }

    renderAdminServiceErrorBanner();
  });

  nativeDocumentAddEventListener('app:route-changed', () => {
    renderAdminServiceErrorBanner();
  });

  nativeDocumentAddEventListener('app:user-loaded', () => {
    renderAdminServiceErrorBanner();
  });
}

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

function withShellVersion(path) {
  const url = new URL(BASE + path, window.location.href);
  url.searchParams.set('v', SHELL_VERSION);
  return url.toString();
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

function getExpectedShellVersion(parsedDoc, targetUrl) {
  const shellScript = [...parsedDoc.querySelectorAll('script[src]')].find(script => {
    const src = script.getAttribute('src');
    if (!src) return false;
    try {
      const u = new URL(src, targetUrl);
      return u.pathname.endsWith('/js/app.js');
    } catch (_) {
      return src.includes('/js/app.js') || src.includes('js/app.js');
    }
  });

  if (!shellScript) return null;

  try {
    const u = new URL(shellScript.getAttribute('src'), targetUrl);
    return u.searchParams.get('v');
  } catch (_) {
    return null;
  }
}

async function runPageScripts(parsedDoc, targetUrl) {
  activeModuleToken += 1;
  runtimeIsolation.cleanupModuleListeners();
  runtimeIsolation.cleanupModuleTimers();
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

  try {
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
  } finally {
    captureModuleListeners = false;
  }
}

async function navigateModule(url, { pushState = true } = {}) {
  if (shellNavInFlight) return;
  shellNavInFlight = true;

  const absolute = toAbsoluteUrl(url);

  try {
    resetRouteFailure();
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
      throw new Error(`Falha HTTP ${res.status} ao carregar o modulo.`);
    }

    const html = await res.text();
    const parsedDoc = new DOMParser().parseFromString(html, 'text/html');
    const expectedVersion = getExpectedShellVersion(parsedDoc, absolute);

    if (expectedVersion && expectedVersion !== SHELL_VERSION) {
      const hardReloadUrl = new URL(absolute, window.location.href);
      hardReloadUrl.searchParams.set('_shellupgrade', `${SHELL_VERSION}->${expectedVersion}`);
      hardReloadUrl.searchParams.set('_t', String(Date.now()));
      window.location.href = hardReloadUrl.toString();
      return;
    }

    removeDynamicPageArtifacts();
    syncPageStyles(parsedDoc, absolute);
    const swapped = syncMainContent(parsedDoc);
    if (!swapped) {
      throw new Error('A rota nao possui conteudo principal valido.');
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
    revealAppWhenReady();
  } catch (error) {
    renderRouteFailureFallback(absolute, error);
  } finally {
    runtimeIsolation.cleanupModuleListeners();
    runtimeIsolation.cleanupModuleTimers();
    captureModuleListeners = false;
    shellNavInFlight = false;
  }
}

function setupShellNavigation() {
  markInitialStylesAsCore();

  document.addEventListener('click', event => {
    const shellAction = event.target?.closest?.('[data-shell-action]');
    if (shellAction?.dataset.shellAction === 'logout') {
      event.preventDefault();
      window.handleLogout?.();
      return;
    }

    if (shellAction?.dataset.shellAction === 'reload-route') {
      event.preventDefault();
      const routeUrl = shellRouteFailure?.routeUrl || window.location.href;
      navigateModule(routeUrl, { pushState: false });
      return;
    }

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

function getNavIcon(moduleKey) {
  const icons = {
    dashboard: '<svg class="nav-icon" viewBox="0 0 18 18" fill="none"><rect x="1" y="1" width="7" height="7" rx="1.5" fill="currentColor" opacity=".8"/><rect x="10" y="1" width="7" height="7" rx="1.5" fill="currentColor" opacity=".5"/><rect x="1" y="10" width="7" height="7" rx="1.5" fill="currentColor" opacity=".5"/><rect x="10" y="10" width="7" height="7" rx="1.5" fill="currentColor" opacity=".8"/></svg>',
    'onboarding-v2': '<svg class="nav-icon" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="currentColor" stroke-width="1.5"/><path d="M9 5v4l3 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    'financial-dashboard': '<svg class="nav-icon" viewBox="0 0 18 18" fill="none"><path d="M2 14h14M2 10h4v4H2zM6 7h4v7H6zM10 4h6v10h-6z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>',
    documentos: '<svg class="nav-icon" viewBox="0 0 18 18" fill="none"><path d="M11 1H4a1 1 0 00-1 1v14a1 1 0 001 1h10a1 1 0 001-1V5l-4-4z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M11 1v4h4M6 9h6M6 12h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    dividas: '<svg class="nav-icon" viewBox="0 0 18 18" fill="none"><rect x="1" y="4" width="16" height="11" rx="1.5" stroke="currentColor" stroke-width="1.5"/><path d="M1 8h16M5 12h3M12 12h2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M5 2h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity=".4"/></svg>',
    onboarding: '<svg class="nav-icon" viewBox="0 0 18 18" fill="none"><rect x="3" y="1" width="12" height="16" rx="1.5" stroke="currentColor" stroke-width="1.5"/><path d="M6 6h6M6 9h6M6 12h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    suporte: '<svg class="nav-icon" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7.5" stroke="currentColor" stroke-width="1.5"/><path d="M9 10.5V11M6.8 7a2.2 2.2 0 014.2.7c0 1.4-2 2.1-2 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  };

  return icons[moduleKey] || icons.dashboard;
}

function renderSidebarNavigation(isAdmin = false) {
  const navRoot = document.getElementById('sidebar-nav-links');
  if (!navRoot) return;

  let modules = [];
  try {
    const router = new Router();
    modules = router.getSidebarModules({ isAdmin });
  } catch (error) {
    console.warn('[APP] Router failed; using fallback sidebar modules', error);
  }

  if (!modules.length) {
    modules = getCanonicalSidebarModules({ isAdmin });
  }

  navRoot.innerHTML = modules.map(module => {
    const label = module.menuLabel || module.title;
    return `
      <a href="${module.key}.html" class="nav-link" data-page="${module.key}" title="${label}">
        ${getNavIcon(module.key)}
        <span class="nav-link-label">${label}</span>
      </a>
    `;
  }).join('');
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
  if (nameEl) {
    nameEl.textContent = display;
    nameEl.hidden = false;
  }
  if (avatarEl)   avatarEl.textContent = initials;
}

function updateShellModeSelector(isAdmin = false) {
  const host = document.getElementById('shell-mode-selector');
  if (!host) return;

  if (typeof unmountShellModeSelector === 'function') {
    unmountShellModeSelector();
    unmountShellModeSelector = null;
  }

  if (!isAdmin) {
    host.innerHTML = '';
    host.hidden = true;
    return;
  }

  host.hidden = false;
  unmountShellModeSelector = mountPortalViewModeSelector(host, {
    label: '',
    adminLabel: 'Admin',
    clientLabel: 'Cliente',
  });
}

function splitFullName(fullName = '') {
  const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' '),
  };
}

function getFreshchatIdentity(user, caso) {
  const metadata = user?.user_metadata || {};
  const fullName = caso?.full_name || metadata.full_name || metadata.name || user?.email || '';
  const { firstName, lastName } = splitFullName(fullName);
  const email = user?.email || caso?.email || '';

  return {
    externalId: user?.id || email,
    firstName: firstName || email,
    lastName,
    email,
    properties: {
      cf_plan: 'Portal HMADV',
      cf_status: caso?.fase || (caso?.onboarding_done ? 'ativo' : 'cadastro'),
      cf_portal_user_id: user?.id || null,
      cf_portal_caso_id: caso?.id || null,
      cf_cpf: caso?.cpf || null,
      cf_onboarding_done: !!caso?.onboarding_done,
      cf_portal_role: user?.app_metadata?.role || user?.role || 'authenticated',
    },
  };
}

function applyFreshchatIdentity(user, caso) {
  if (!window.fcWidget || !window.fcWidget.user) return false;

  const identity = getFreshchatIdentity(user, caso);
  try {
    if (identity.externalId && typeof window.fcWidget.setExternalId === 'function') {
      window.fcWidget.setExternalId(String(identity.externalId));
    }
    if (identity.firstName && typeof window.fcWidget.user.setFirstName === 'function') {
      window.fcWidget.user.setFirstName(String(identity.firstName));
    }
    if (identity.lastName && typeof window.fcWidget.user.setLastName === 'function') {
      window.fcWidget.user.setLastName(String(identity.lastName));
    }
    if (identity.email && typeof window.fcWidget.user.setEmail === 'function') {
      window.fcWidget.user.setEmail(String(identity.email));
    }
    if (typeof window.fcWidget.user.setProperties === 'function') {
      const properties = Object.fromEntries(
        Object.entries(identity.properties).filter(([, value]) => value !== null && value !== undefined && value !== '')
      );
      window.fcWidget.user.setProperties(properties);
    }
    return true;
  } catch (error) {
    console.warn('[Freshchat] Falha ao identificar usuario no widget', error);
    return false;
  }
}

function waitAndApplyFreshchatIdentity(user, caso, attempt = 0) {
  if (applyFreshchatIdentity(user, caso)) return;
  if (attempt >= 30) return;
  setTimeout(() => waitAndApplyFreshchatIdentity(user, caso, attempt + 1), 500);
}

function ensureFreshchatVisible() {
  if (!document.getElementById(FRESHCHAT_VISIBLE_STYLE_ID)) {
    const style = document.createElement('style');
    style.id = FRESHCHAT_VISIBLE_STYLE_ID;
    style.textContent = `
      iframe[src*="wchat.freshchat.com"],
      iframe[src*="freshchat"],
      iframe[src*="freshworks"],
      #fc_frame,
      .fc-widget-normal,
      .fc-widget-small,
      .fc-widget-open {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        z-index: 2147483000 !important;
      }
    `;
    document.head.appendChild(style);
  }

  try {
    if (window.fcWidget && typeof window.fcWidget.show === 'function') window.fcWidget.show();
  } catch (_) {}
}

function startFreshchatWatchdog(user, caso) {
  if (freshchatWatchdogTimer) clearInterval(freshchatWatchdogTimer);
  freshchatWatchdogTimer = setInterval(() => {
    if (PUBLIC_PAGES.includes(getCurrentPage())) return;
    ensureFreshchatVisible();
    initFreshchatWidget(user, caso) || waitAndApplyFreshchatIdentity(user, caso, 26);
  }, FRESHCHAT_WATCHDOG_INTERVAL_MS);
}

function removeFreshchatWidget() {
  if (freshchatWatchdogTimer) {
    clearInterval(freshchatWatchdogTimer);
    freshchatWatchdogTimer = null;
  }
  window.__portalFreshchatInitialized = false;
  document.getElementById(FRESHCHAT_SCRIPT_ID)?.remove();
  document.getElementById(FRESHCHAT_VISIBLE_STYLE_ID)?.remove();
  document.querySelectorAll('iframe[src*="wchat.freshchat.com"], iframe[src*="freshchat"], iframe[src*="freshworks"]').forEach(el => el.remove());
  try {
    if (window.fcWidget && typeof window.fcWidget.destroy === 'function') window.fcWidget.destroy();
  } catch (_) {}
}

function initFreshchatWidget(user, caso) {
  if (!window.fcWidget || typeof window.fcWidget.init !== 'function') return false;

  try {
    if (!window.__portalFreshchatInitialized) {
      window.fcWidget.init({
        token: FRESHCHAT_WIDGET_TOKEN,
        host: FRESHCHAT_WIDGET_HOST,
      });
      window.__portalFreshchatInitialized = true;
    }
    ensureFreshchatVisible();
    waitAndApplyFreshchatIdentity(user, caso);
    return true;
  } catch (error) {
    console.warn('[Freshchat] Falha ao inicializar widget web', error);
    return false;
  }
}

function mountClientFreshchatWidget({ user, caso } = {}) {
  if (!user || PUBLIC_PAGES.includes(getCurrentPage())) {
    removeFreshchatWidget();
    return;
  }

  ensureFreshchatVisible();

  if (!document.getElementById(FRESHCHAT_SCRIPT_ID)) {
    const script = document.createElement('script');
    script.id = FRESHCHAT_SCRIPT_ID;
    script.src = FRESHCHAT_SCRIPT_SRC;
    script.async = true;
    script.onload = () => initFreshchatWidget(user, caso);
    document.head.appendChild(script);
  } else {
    initFreshchatWidget(user, caso);
  }

  waitAndApplyFreshchatIdentity(user, caso);
  startFreshchatWatchdog(user, caso);
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
    const res = await fetch(withShellVersion(path), {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
    });
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
    updateShellModeSelector(cached.isAdmin);
  }

  await Promise.all([
    loadComponent('[data-component="sidebar"]', 'components/sidebar.html'),
    loadComponent('[data-component="header"]',  'components/header.html'),
  ]);

  renderSidebarNavigation(cached?.isAdmin || false);
  initRouter();

  // Wire up interactions (scripts in injected HTML don't execute via innerHTML)
  window.handleLogout = () => {
    try { sessionStorage.removeItem('portal:user'); } catch (_) {}
    removeFreshchatWidget();
    AuthService.logout();
  };

  setupSidebarMobile();

  // Restore from cache after HTML injection
  if (cached?.user) {
    updateSidebarUser(cached.user, cached.caso, cached.isAdmin);
    updateHeaderUser(cached.user);
    updateShellModeSelector(cached.isAdmin);
  }
}

/* ── User loading ────────────────────────────────── */
async function loadUser() {
  const user = await AuthService.getUser();
  if (!user) return;

  const isAdmin = await checkIsAdmin().catch(() => false);
  let hasStoredMode = false;
  try {
    hasStoredMode = !!sessionStorage.getItem(VIEW_MODE_KEY);
  } catch (_) {
    hasStoredMode = false;
  }

  if (!isAdmin) {
    setPortalViewMode('cliente', { source: 'role-force', persist: true, emit: false });
  } else if (!hasStoredMode) {
    setPortalViewMode('admin', { source: 'role-default', persist: true, emit: false });
  }

  if (!isAdmin) {
    try { await CaseService.ensureExists(); } catch (_) {}
  }
  const caso = isAdmin ? null : await CaseService.get().catch(() => null);

  const detail = { user, caso, isAdmin };
  appUserDetail = detail;

  // Update UI immediately
  renderSidebarNavigation(isAdmin);
  updateSidebarUser(user, caso, isAdmin);
  updateHeaderUser(user);
  updateShellModeSelector(isAdmin);
  mountClientFreshchatWidget(detail);

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

  runtimeIsolationEnabled = window.location.pathname.includes('/pages/');

  await loadComponents();
  try {
    await loadUser();
  } catch (error) {
    console.warn('[APP] User load failed; preserving shell navigation', error);
    renderSidebarNavigation(false);
    updateShellModeSelector(false);
  }
  setupServiceErrorBannerListener();
  setupShellNavigation();

  initRouter();
  initToast();
  setTimeout(initModalClose, 100);

  window.showToast = showToast;
  document.dispatchEvent(new CustomEvent('app:ready'));

  // Notify shell subsystems (NotificationCenter, Observability, etc.)
  bus.emit('shell.ready', { authDetail: appUserDetail });

  // Reveal only when shell, sidebar and page content are valid.
  revealAppWhenReady();
}

nativeDocumentAddEventListener('DOMContentLoaded', init);
