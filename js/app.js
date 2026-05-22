import { Router }                    from './router.js';
import { getSidebarModules as getCanonicalSidebarModules } from './navigation.js';
import { installRuntimeIsolation }   from './shell-runtime-isolation.js';
import { initUiKit }                 from '../components/ui/index.js';
import { AuthService }               from '../services/auth.js';
import { showToast }                 from '../utils/helpers.js';
import { CaseService, checkIsAdmin } from '../services/database.js';
import {
  LegalNotificationService,
  LEGAL_NOTIFICATION_STATUSES,
  LEGAL_NOTIFICATION_TYPES,
} from '../services/legal-notifications.js';

const BASE = window.location.pathname.includes('/pages/') ? '../' : './';

const PUBLIC_PAGES = ['login', 'auth-callback'];
const SHELL_SCRIPT_ATTR = 'data-shell-page-script';
const SHELL_STYLE_ATTR = 'data-shell-page-style';
const SIDEBAR_COLLAPSED_KEY = 'portal:sidebar-collapsed';
const VIEW_MODE_KEY = 'portal:view-mode';
const VIEW_MODE_EVENT = 'portal:view-mode-changed';
const SHELL_SUPPRESSED_EVENT = 'shell:callback-suppressed';
const SHELL_SERVICE_ERROR_EVENT = 'portal:service-error';
const SHELL_VERSION = '20260522c';
const SHELL_TELEMETRY_MAX = 100;
const SHELL_TELEMETRY_SAMPLE_RATE = 0.6;
const SHELL_TELEMETRY_MAX_PER_ROUTE = 24;
const SHELL_SERVICE_ERRORS_MAX = 80;
const FRESHCHAT_SCRIPT_ID = 'freshchat-private-widget';
const FRESHCHAT_SCRIPT_SRC = 'https://eu.fw-cdn.com/10713913/375987.js';
const FRESHCHAT_WIDGET_ID = '2bb07572-34a4-4ea6-9708-4ec2ed23589d';
const FRESHCHAT_VISIBLE_STYLE_ID = 'freshchat-shell-persistence-style';
const FRESHCHAT_WATCHDOG_INTERVAL_MS = 5000;
const SHELL_WORKSPACE_KEY = 'portal:workspace-state';
const SHELL_NOTIFICATIONS_KEY = 'portal:notifications';
const SHELL_TENANT_CONFIG_KEY = 'portal:tenant-config';
const SHELL_MAX_RECENT_ROUTES = 6;

window.__shellVersion = SHELL_VERSION;

const componentHtmlCache = new Map();
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
let shellManagersReady = false;
let shellLegalNotificationItems = [];
let shellLegalNotificationSource = 'session';
const shellLegalNotificationFilters = { types: [], statuses: [] };

function getUserDisplayState(user, isAdmin = false) {
  const email = user?.email || '';
  const display = user?.user_metadata?.full_name || user?.user_metadata?.name || email || 'Conta HMADV';
  const initials = String(display)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase() || 'HM';

  return {
    email,
    display,
    initials,
    roleLabel: isAdmin ? 'Administrador' : 'Cliente',
  };
}

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

function getEffectiveIsAdmin(hasAdminAccess = null) {
  const canUseAdminView = typeof hasAdminAccess === 'boolean'
    ? hasAdminAccess
    : !!appUserDetail?.isAdmin;

  if (!canUseAdminView) return false;
  return getStoredViewMode() === 'admin';
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

  return Boolean(sidebar && header && main && main.children.length > 0 && navLinks.length >= 6);
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

function setAccountMenuOpen(open) {
  const trigger = document.getElementById('header-user-trigger');
  const menu = document.getElementById('header-user-menu');
  const shell = document.getElementById('header-user-shell');
  if (!trigger || !menu || !shell) return;

  const nextOpen = Boolean(open);
  trigger.setAttribute('aria-expanded', nextOpen ? 'true' : 'false');
  menu.hidden = !nextOpen;
  shell.classList.toggle('is-open', nextOpen);
}

function toggleAccountMenu(force = null) {
  const trigger = document.getElementById('header-user-trigger');
  const expanded = trigger?.getAttribute('aria-expanded') === 'true';
  setAccountMenuOpen(force === null ? !expanded : force);
}

function renderSidebarToggleButton({ mobile = false, expanded = true } = {}) {
  const toggle = document.getElementById('sidebar-toggle');
  if (!toggle) return;

  const icon = mobile
    ? (expanded
      ? '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>'
      : '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>')
    : (expanded
      ? '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><rect x="3" y="4" width="14" height="12" rx="2" stroke="currentColor" stroke-width="1.7"/><path d="M8 4v12M12.5 8.5 10 10l2.5 1.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>'
      : '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><rect x="3" y="4" width="14" height="12" rx="2" stroke="currentColor" stroke-width="1.7"/><path d="M8 4v12M11 8.5l3 2-3 2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>');

  toggle.innerHTML = icon;
  toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  toggle.setAttribute('aria-label', mobile
    ? (expanded ? 'Fechar menu lateral' : 'Abrir menu lateral')
    : (expanded ? 'Recolher menu lateral' : 'Expandir menu lateral'));
  toggle.setAttribute('title', mobile
    ? (expanded ? 'Fechar menu' : 'Abrir menu')
    : (expanded ? 'Recolher menu' : 'Expandir menu'));
  toggle.classList.toggle('is-collapsed', !expanded && !mobile);
}

function renderRouteFailureFallback(routeUrl, error) {
  setRouteFailure(routeUrl, error);
  addShellNotification({
    title: 'Falha ao abrir módulo',
    text: error?.message || 'Tente recarregar a rota.',
    tone: 'warn',
  });

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
    initUiKit(document);

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
    const clickedInsideAccountMenu = !!event.target?.closest?.('#header-user-shell');

    if (!clickedInsideAccountMenu) {
      setAccountMenuOpen(false);
    }

    if (shellAction?.dataset.shellAction === 'logout') {
      event.preventDefault();
      setAccountMenuOpen(false);
      window.handleLogout?.();
      return;
    }

    if (shellAction?.dataset.shellAction === 'account-menu-toggle') {
      event.preventDefault();
      event.stopPropagation();
      toggleAccountMenu();
      return;
    }

    if (shellAction?.dataset.shellAction === 'open-account-modal') {
      event.preventDefault();
      openAccountModal(shellAction.dataset.accountView || 'conta');
      return;
    }

    if (shellAction?.dataset.shellAction === 'reload-route') {
      event.preventDefault();
      const routeUrl = shellRouteFailure?.routeUrl || window.location.href;
      navigateModule(routeUrl, { pushState: false });
      return;
    }

    if (shellAction?.dataset.shellAction === 'global-search') {
      event.preventDefault();
      openGlobalSearchPanel();
      return;
    }

    if (shellAction?.dataset.shellAction === 'workspace-panel') {
      event.preventDefault();
      openWorkspacePanel();
      return;
    }

    if (shellAction?.dataset.shellAction === 'notifications-panel') {
      event.preventDefault();
      openWorkspacePanel();
      return;
    }

    if (shellAction?.dataset.shellAction === 'close-shell-drawer') {
      event.preventDefault();
      closeShellDrawer();
      return;
    }

    if (shellAction?.dataset.shellAction === 'close-shell-modal') {
      event.preventDefault();
      closeShellModal();
      return;
    }

    if (shellAction?.dataset.shellAction === 'clear-notifications') {
      event.preventDefault();
      setShellNotifications([]);
      openWorkspacePanel();
      return;
    }

    if (event.target?.closest?.('[data-legal-filter-clear]')) {
      event.preventDefault();
      clearLegalNotificationFilters();
      return;
    }

    const legalFilter = event.target?.closest?.('[data-legal-filter-kind]');
    if (legalFilter) {
      event.preventDefault();
      toggleLegalNotificationFilter(legalFilter.dataset.legalFilterKind, legalFilter.dataset.legalFilterValue);
      openWorkspacePanel({ reload: false });
      return;
    }

    const legalItem = event.target?.closest?.('[data-legal-notification-id]');
    if (legalItem) {
      event.preventDefault();
      openLegalNotificationDetail(legalItem.dataset.legalNotificationId);
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

  window.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      setAccountMenuOpen(false);
    }
    const wantsSearch = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k';
    if (wantsSearch) {
      event.preventDefault();
      openGlobalSearchPanel();
    }
  });
}

function syncShellViewMode({ navigateOnMismatch = true, source = 'view-mode' } = {}) {
  const effectiveIsAdmin = getEffectiveIsAdmin();
  renderSidebarNavigation(effectiveIsAdmin);
  if (appUserDetail?.user) {
    updateSidebarUser(appUserDetail.user, appUserDetail.caso, effectiveIsAdmin);
    updateHeaderUser(appUserDetail.user, effectiveIsAdmin);
  }
  initRouter();
  revealAppWhenReady();

  if (!navigateOnMismatch) return;

  const modules = getShellModules();
  const current = getCurrentPage();
  if (PUBLIC_PAGES.includes(current)) return;
  if (modules.some(module => module.key === current)) return;

  const fallback = modules[0]?.key;
  if (!fallback || fallback === current) return;
  navigateModule(`${fallback}.html`, { pushState: true });
}

function getNavIcon(moduleKey) {
  const icons = {
    dashboard: '<svg class="nav-icon" viewBox="0 0 18 18" fill="none"><rect x="1" y="1" width="7" height="7" rx="1.5" fill="currentColor" opacity=".8"/><rect x="10" y="1" width="7" height="7" rx="1.5" fill="currentColor" opacity=".5"/><rect x="1" y="10" width="7" height="7" rx="1.5" fill="currentColor" opacity=".5"/><rect x="10" y="10" width="7" height="7" rx="1.5" fill="currentColor" opacity=".8"/></svg>',
    'meu-caso': '<svg class="nav-icon" viewBox="0 0 18 18" fill="none"><path d="M9 15s-6-3.6-6-8.1A3.3 3.3 0 019 4.7a3.3 3.3 0 016 2.2C15 11.4 9 15 9 15Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M6 9h2l1-2 1 4 1-2h1" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    'meus-documentos': '<svg class="nav-icon" viewBox="0 0 18 18" fill="none"><path d="M11 1H4a1 1 0 00-1 1v14a1 1 0 001 1h10a1 1 0 001-1V5l-4-4z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M11 1v4h4M6 9h6M6 12h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    'minhas-dividas': '<svg class="nav-icon" viewBox="0 0 18 18" fill="none"><rect x="1" y="4" width="16" height="11" rx="1.5" stroke="currentColor" stroke-width="1.5"/><path d="M1 8h16M5 12h3M12 12h2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M5 2h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity=".4"/></svg>',
    'meu-plano': '<svg class="nav-icon" viewBox="0 0 18 18" fill="none"><path d="M6 3 2 5v10l4-2 6 2 4-2V3l-4 2-6-2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M6 3v10M12 5v10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    ajuda: '<svg class="nav-icon" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7.5" stroke="currentColor" stroke-width="1.5"/><path d="M9 10.5V11M6.8 7a2.2 2.2 0 014.2.7c0 1.4-2 2.1-2 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    painel: '<svg class="nav-icon" viewBox="0 0 18 18" fill="none"><rect x="2" y="5" width="14" height="10" rx="1.5" stroke="currentColor" stroke-width="1.5"/><path d="M6.5 5V3.5A1.5 1.5 0 018 2h2a1.5 1.5 0 011.5 1.5V5M2 9h14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    clientes: '<svg class="nav-icon" viewBox="0 0 18 18" fill="none"><path d="M7 8a3 3 0 100-6 3 3 0 000 6ZM2 16a5 5 0 0110 0M13 7.5a2.5 2.5 0 100-5M13.5 11c1.4.4 2.5 1.7 2.5 3.2V16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    'onboarding-v2': '<svg class="nav-icon" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="currentColor" stroke-width="1.5"/><path d="M9 5v4l3 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    'financial-dashboard': '<svg class="nav-icon" viewBox="0 0 18 18" fill="none"><path d="M2 14h14M2 10h4v4H2zM6 7h4v7H6zM10 4h6v10h-6z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>',
    documentos: '<svg class="nav-icon" viewBox="0 0 18 18" fill="none"><path d="M11 1H4a1 1 0 00-1 1v14a1 1 0 001 1h10a1 1 0 001-1V5l-4-4z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M11 1v4h4M6 9h6M6 12h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    dividas: '<svg class="nav-icon" viewBox="0 0 18 18" fill="none"><rect x="1" y="4" width="16" height="11" rx="1.5" stroke="currentColor" stroke-width="1.5"/><path d="M1 8h16M5 12h3M12 12h2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M5 2h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity=".4"/></svg>',
    planos: '<svg class="nav-icon" viewBox="0 0 18 18" fill="none"><path d="M3 15h12M4 7.5h10M5 7.5V15M9 7.5V15M13 7.5V15M3 5l6-3 6 3v2H3V5Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    processos: '<svg class="nav-icon" viewBox="0 0 18 18" fill="none"><path d="M9 2v13M4 5h10M3 15h12M5 5 2.5 10h5L5 5ZM13 5l-2.5 5h5L13 5Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    tarefas: '<svg class="nav-icon" viewBox="0 0 18 18" fill="none"><rect x="2" y="2" width="14" height="14" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="m5 9 2.2 2.2L13 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    agenda: '<svg class="nav-icon" viewBox="0 0 18 18" fill="none"><rect x="2" y="3" width="14" height="13" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M5 1.5v3M13 1.5v3M2 7h14M5 10h2M10 10h3M5 13h2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    mensagens: '<svg class="nav-icon" viewBox="0 0 18 18" fill="none"><path d="M3 3h12a1.5 1.5 0 011.5 1.5v7A1.5 1.5 0 0115 13H8l-4 3v-3H3a1.5 1.5 0 01-1.5-1.5v-7A1.5 1.5 0 013 3Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M5 7h8M5 10h5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    financeiro: '<svg class="nav-icon" viewBox="0 0 18 18" fill="none"><path d="M3 4.5h12A1.5 1.5 0 0116.5 6v8A1.5 1.5 0 0115 15.5H3A1.5 1.5 0 011.5 14V6A1.5 1.5 0 013 4.5Z" stroke="currentColor" stroke-width="1.5"/><path d="M13 3v3M12.5 10h4M4.5 9h4M4.5 12h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    analytics: '<svg class="nav-icon" viewBox="0 0 18 18" fill="none"><path d="M3 14h12M5 11l2-2 2 1 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="5" cy="11" r="1" fill="currentColor"/><circle cx="7" cy="9" r="1" fill="currentColor"/><circle cx="9" cy="10" r="1" fill="currentColor"/><circle cx="13" cy="6" r="1" fill="currentColor"/></svg>',
    'ai-copilot': '<svg class="nav-icon" viewBox="0 0 18 18" fill="none"><path d="M9 2.5 10.5 6 14 7.5l-3.5 1.5L9 12.5 7.5 9 4 7.5 7.5 6 9 2.5Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M13.5 12.5 14 14l1.5.5-1.5.5-.5 1.5-.5-1.5-1.5-.5 1.5-.5.5-1.5Z" fill="currentColor"/></svg>',
    'experiencia-cliente': '<svg class="nav-icon" viewBox="0 0 18 18" fill="none"><path d="M9 15s-5-3.1-5-7a2.7 2.7 0 0 1 5-1.5A2.7 2.7 0 0 1 14 8c0 3.9-5 7-5 7Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>',
    'financeiro-inteligencia': '<svg class="nav-icon" viewBox="0 0 18 18" fill="none"><path d="M9 2.5a4 4 0 0 0-4 4c0 1 .4 1.9 1 2.6V11a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V9.1a4 4 0 0 0 1-2.6 4 4 0 0 0-4-4Z" stroke="currentColor" stroke-width="1.5"/><path d="M7 14h4M7.5 16h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    'operacoes-juridicas': '<svg class="nav-icon" viewBox="0 0 18 18" fill="none"><path d="M9 2v12M4 5h10M3 14h12M5 5 3 9h4L5 5Zm8 0-2 4h4l-2-4Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    compliance: '<svg class="nav-icon" viewBox="0 0 18 18" fill="none"><path d="M9 2.5 14 4.5v4c0 3.3-2.1 5.8-5 7-2.9-1.2-5-3.7-5-7v-4l5-2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="m6.8 9 1.6 1.6L11.5 7.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    'platform-os': '<svg class="nav-icon" viewBox="0 0 18 18" fill="none"><rect x="2" y="3" width="14" height="4" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="2" y="11" width="14" height="4" rx="1" stroke="currentColor" stroke-width="1.5"/><path d="M5 7v4M9 7v4M13 7v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    'ui-os': '<svg class="nav-icon" viewBox="0 0 18 18" fill="none"><rect x="2" y="3" width="14" height="12" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M2 7h14M6 11h2M10 11h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    'workspace-os': '<svg class="nav-icon" viewBox="0 0 18 18" fill="none"><rect x="2" y="3" width="14" height="12" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M7 3v12M7 8h9" stroke="currentColor" stroke-width="1.5"/></svg>',
    'billing-os': '<svg class="nav-icon" viewBox="0 0 18 18" fill="none"><path d="M4 4.5h10A1.5 1.5 0 0 1 15.5 6v6A1.5 1.5 0 0 1 14 13.5H4A1.5 1.5 0 0 1 2.5 12V6A1.5 1.5 0 0 1 4 4.5Z" stroke="currentColor" stroke-width="1.5"/><path d="M11 9h2.5M5 8.5h2M5 11h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
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

  const sections = [];
  const sectionMap = new Map();

  modules.forEach(module => {
    const sectionKey = isAdmin
      ? (module.adminSidebarSection || module.sidebarSection || 'workspace')
      : (module.sidebarSection || 'portal');
    if (!sectionMap.has(sectionKey)) {
      const section = {
        key: sectionKey,
        label: isAdmin
          ? (module.adminSidebarSectionLabel || module.sidebarSectionLabel || 'Meu Escritório')
          : (module.sidebarSectionLabel || 'Portal'),
        order: isAdmin
          ? (module.adminSidebarSectionOrder ?? module.sidebarSectionOrder ?? 999)
          : (module.sidebarSectionOrder ?? 999),
        items: [],
      };
      sectionMap.set(sectionKey, section);
      sections.push(section);
    }
    sectionMap.get(sectionKey).items.push(module);
  });

  navRoot.innerHTML = sections
    .sort((a, b) => a.order - b.order)
    .map(section => `
      <section class="sidebar-nav-group" data-nav-group="${escapeShellHtml(section.key)}">
        <div class="nav-section-label">${escapeShellHtml(section.label)}</div>
        ${section.items.map(module => {
          const label = module.menuLabel || module.title;
          const title = module.title || label;
          return `
            <a href="${module.key}.html" class="nav-link" data-page="${module.key}" data-nav-section="${escapeShellHtml(section.key)}" title="${escapeShellHtml(title)}">
              ${getNavIcon(module.key)}
              <span class="nav-link-label">${escapeShellHtml(label)}</span>
            </a>
          `;
        }).join('')}
      </section>
    `).join('');
}

/* ── Sidebar / Header update (scripts don't run via innerHTML) ─── */
function updateSidebarUser(user, caso, isAdmin) {
  const emailEl  = document.getElementById('sidebar-user-email');
  const statusEl = document.getElementById('sidebar-case-status');
  if (emailEl)  emailEl.textContent  = user?.email || '';
  if (statusEl) {
    statusEl.textContent = appUserDetail?.isAdmin && !isAdmin
      ? 'Visualizacao cliente'
      : (isAdmin ? 'Administrador' : (caso?.fase || 'Cadastro'));
  }
}

function updateHeaderUser(user, isAdmin = false) {
  const nameEl   = document.getElementById('header-user-name');
  const roleEl   = document.getElementById('header-user-role');
  const avatarEl = document.getElementById('header-avatar');
  const menuNameEl = document.getElementById('header-user-menu-name');
  const menuEmailEl = document.getElementById('header-user-menu-email');
  if (!user) return;
  const displayState = getUserDisplayState(user, appUserDetail?.isAdmin || false);
  const roleLabel = appUserDetail?.isAdmin && !isAdmin
    ? 'Administrador · visao cliente'
    : displayState.roleLabel;
  if (nameEl) {
    nameEl.textContent = displayState.display;
    nameEl.hidden = false;
  }
  if (roleEl) {
    roleEl.textContent = roleLabel;
    roleEl.hidden = false;
  }
  if (avatarEl) avatarEl.textContent = displayState.initials;
  if (menuNameEl) menuNameEl.textContent = displayState.display;
  if (menuEmailEl) menuEmailEl.textContent = displayState.email || roleLabel;
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
      iframe[src*="wchat.eu.freshchat.com"],
      iframe[src*="fw-cdn.com"],
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
  document.querySelectorAll('iframe[src*="wchat.freshchat.com"], iframe[src*="wchat.eu.freshchat.com"], iframe[src*="fw-cdn.com"], iframe[src*="freshchat"], iframe[src*="freshworks"]').forEach(el => el.remove());
  try {
    if (window.fcWidget && typeof window.fcWidget.destroy === 'function') window.fcWidget.destroy();
  } catch (_) {}
}

function initFreshchatWidget(user, caso) {
  const script = document.getElementById(FRESHCHAT_SCRIPT_ID);
  if (!script) return false;

  try {
    window.__portalFreshchatInitialized = true;
    ensureFreshchatVisible();
    waitAndApplyFreshchatIdentity(user, caso);
    return true;
  } catch (error) {
    console.warn('[Freshchat] Falha ao inicializar widget Freshworks', error);
    return false;
  }
}

function mountClientFreshchatWidget({ user, caso, isAdmin } = {}) {
  if (!user || isAdmin || PUBLIC_PAGES.includes(getCurrentPage())) {
    removeFreshchatWidget();
    return;
  }

  ensureFreshchatVisible();

  if (!document.getElementById(FRESHCHAT_SCRIPT_ID)) {
    const script = document.createElement('script');
    script.id = FRESHCHAT_SCRIPT_ID;
    script.src = FRESHCHAT_SCRIPT_SRC;
    script.async = true;
    script.setAttribute('chat', 'true');
    script.setAttribute('widgetId', FRESHCHAT_WIDGET_ID);
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
    renderSidebarToggleButton({ mobile: isMobile(), expanded: false });
  };

  const openSidebar = () => {
    sidebar.classList.add('sidebar-open');
    overlay.classList.add('visible');
    document.body.style.overflow = 'hidden';
    renderSidebarToggleButton({ mobile: isMobile(), expanded: true });
  };

  const setDesktopCollapsed = (collapsed) => {
    shell.classList.toggle('sidebar-collapsed', collapsed);
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? '1' : '0');
    } catch (_) {}
    renderSidebarToggleButton({ mobile: false, expanded: !collapsed });
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
      renderSidebarToggleButton({ mobile: true, expanded: false });
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
  const url = withShellVersion(path);
  if (el.dataset.shellComponentLoaded === 'true' && el.dataset.shellComponentUrl === url) {
    return;
  }

  try {
    let html = componentHtmlCache.get(url);
    if (!html) {
      const res = await fetch(url, {
        cache: 'force-cache',
        headers: { 'Cache-Control': 'max-age=300' },
      });
      if (!res.ok) throw new Error(res.status);
      html = await res.text();
      componentHtmlCache.set(url, html);
    }

    if (el.innerHTML !== html) el.innerHTML = html;
    el.dataset.shellComponentLoaded = 'true';
    el.dataset.shellComponentUrl = url;
  } catch (e) {
    console.warn('[APP] Component load failed:', path, e);
  }
}

async function loadComponents() {
  // Pre-populate from cache for instant render
  const cached = getCached();
  const cachedEffectiveIsAdmin = getEffectiveIsAdmin(cached?.isAdmin || false);
  if (cached?.user) {
    updateSidebarUser(cached.user, cached.caso, cachedEffectiveIsAdmin);
    updateHeaderUser(cached.user, cachedEffectiveIsAdmin);
    updateShellModeSelector(cached.isAdmin);
  }

  await Promise.all([
    loadComponent('[data-component="sidebar"]', 'shell/sidebar/sidebar.html'),
    loadComponent('[data-component="header"]',  'shell/header/header.html'),
  ]);

  ensureShellManagers();
  renderSidebarNavigation(cachedEffectiveIsAdmin);
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
    updateSidebarUser(cached.user, cached.caso, cachedEffectiveIsAdmin);
    updateHeaderUser(cached.user, cachedEffectiveIsAdmin);
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
  setRuntimeTenantConfig(detail);
  const effectiveIsAdmin = getEffectiveIsAdmin(isAdmin);

  // Update UI immediately
  renderSidebarNavigation(effectiveIsAdmin);
  updateSidebarUser(user, caso, effectiveIsAdmin);
  updateHeaderUser(user, effectiveIsAdmin);
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
  rememberWorkspaceRoute();
  renderMobileWorkspaceNav();

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

async function bootPortalShell() {
  const startedAt = performance.now();

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
  ensureShellManagers();

  initRouter();
  initToast();
  setTimeout(initModalClose, 100);
  initUiKit(document);

  window.showToast = showToast;
  document.dispatchEvent(new CustomEvent('app:ready'));

  // Reveal only when shell, sidebar and page content are valid.
  revealAppWhenReady();

  const durationMs = Math.round(performance.now() - startedAt);
  window.__shellRuntime = {
    runtime: 'portal',
    version: SHELL_VERSION,
    durationMs,
    ts: Date.now(),
  };
}

function getShellModules() {
  const isAdmin = getEffectiveIsAdmin();
  try {
    return new Router().getSidebarModules({ isAdmin });
  } catch (_) {
    return getCanonicalSidebarModules({ isAdmin });
  }
}

function getActiveTenantId() {
  const workspaceId = appUserDetail?.caso?.workspace_id;
  if (workspaceId) return String(workspaceId);

  try {
    const stored = JSON.parse(sessionStorage.getItem(SHELL_TENANT_CONFIG_KEY) || 'null');
    if (stored?.id) return String(stored.id);
  } catch (_) {}

  return 'hmadv';
}

function getTenantScopedStorageKey(baseKey) {
  return `${baseKey}:${getActiveTenantId()}`;
}

function setRuntimeTenantConfig(detail = {}) {
  const config = {
    id: detail?.caso?.workspace_id || 'hmadv',
    featureFlags: { ...(window.__portalTenantConfig?.featureFlags || {}) },
  };

  window.__portalTenantConfig = config;

  try {
    sessionStorage.setItem(SHELL_TENANT_CONFIG_KEY, JSON.stringify(config));
  } catch (_) {}
}

function getShellWorkspaceState() {
  try {
    return JSON.parse(localStorage.getItem(getTenantScopedStorageKey(SHELL_WORKSPACE_KEY)) || '{}') || {};
  } catch (_) {
    return {};
  }
}

function setShellWorkspaceState(nextState) {
  try {
    localStorage.setItem(getTenantScopedStorageKey(SHELL_WORKSPACE_KEY), JSON.stringify(nextState));
  } catch (_) {}
}

function rememberWorkspaceRoute() {
  const current = getCurrentPage();
  if (PUBLIC_PAGES.includes(current)) return;

  const module = getShellModules().find(item => item.key === current);
  if (!module) return;

  const state = getShellWorkspaceState();
  const route = {
    key: module.key,
    title: module.menuLabel || module.title,
    href: `${module.key}.html`,
    ts: Date.now(),
  };
  const recentRoutes = [route, ...(state.recentRoutes || []).filter(item => item.key !== route.key)]
    .slice(0, SHELL_MAX_RECENT_ROUTES);
  setShellWorkspaceState({ ...state, currentRoute: route, recentRoutes });
}

function getShellNotifications() {
  try {
    return JSON.parse(sessionStorage.getItem(getTenantScopedStorageKey(SHELL_NOTIFICATIONS_KEY)) || '[]') || [];
  } catch (_) {
    return [];
  }
}

function setShellNotifications(items) {
  try {
    sessionStorage.setItem(getTenantScopedStorageKey(SHELL_NOTIFICATIONS_KEY), JSON.stringify(items.slice(0, 30)));
  } catch (_) {}
  renderShellNotificationCount();
}

function addShellNotification({ title, text = '', tone = 'brand' } = {}) {
  const item = {
    id: `ntf-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title: title || 'Atualização do portal',
    text,
    tone,
    ts: Date.now(),
    read: false,
  };
  setShellNotifications([item, ...getShellNotifications()]);
  return item;
}

function renderShellNotificationCount() {
  const badge = document.getElementById('shell-notification-count');
  if (!badge) return;
  const realUnread = shellLegalNotificationItems.filter(item => item.status === 'nao_lido').length;
  const count = realUnread || getShellNotifications().filter(item => !item.read).length;
  badge.hidden = count === 0;
  badge.textContent = String(Math.min(count, 9));
}

async function loadShellLegalNotifications() {
  try {
    shellLegalNotificationItems = await LegalNotificationService.list();
    shellLegalNotificationSource = 'supabase';
  } catch (error) {
    shellLegalNotificationItems = LegalNotificationService.normalizeLocal(getShellNotifications());
    shellLegalNotificationSource = 'session';
  }
  renderShellNotificationCount();
  return shellLegalNotificationItems;
}

function toggleLegalNotificationFilter(kind, value) {
  if (!['types', 'statuses'].includes(kind) || !value) return;
  const current = shellLegalNotificationFilters[kind];
  shellLegalNotificationFilters[kind] = current.includes(value)
    ? current.filter(item => item !== value)
    : [...current, value];
}

function getFilteredLegalNotifications() {
  return shellLegalNotificationItems.filter(item => {
    const typeOk = !shellLegalNotificationFilters.types.length || shellLegalNotificationFilters.types.includes(item.type);
    const statusOk = !shellLegalNotificationFilters.statuses.length || shellLegalNotificationFilters.statuses.includes(item.status);
    return typeOk && statusOk;
  });
}

function countLegalNotifications(kind, value) {
  return shellLegalNotificationItems.filter(item => item[kind] === value).length;
}

function legalNotificationIcon(name) {
  const icons = {
    scale: '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 3v14M5 6h10M6 6l-3 5h6L6 6Zm8 0-3 5h6l-3-5Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    'file-text': '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M6 2h6l4 4v12H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" stroke="currentColor" stroke-width="1.5"/><path d="M12 2v5h4M7 11h6M7 14h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    receipt: '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M5 3h10v14l-2-1-2 1-2-1-2 1-2-1V3Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M8 7h4M8 10h4M8 13h2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    bell: '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M6 8a4 4 0 0 1 8 0v3.5l1.5 2.5h-11L6 11.5V8Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M8.5 16a1.7 1.7 0 0 0 3 0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    pen: '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m4 14-.8 3 3-.8L16 6.4 13.6 4 4 14Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="m12.5 5.1 2.4 2.4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  };
  return icons[name] || icons.bell;
}

function shellTimeAgo(ts) {
  const diff = Math.max(0, Date.now() - Number(ts || Date.now()));
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h`;
  return `${Math.floor(hours / 24)} d`;
}

function ensureShellManagers() {
  if (shellManagersReady) {
    renderShellNotificationCount();
    renderMobileWorkspaceNav();
    return;
  }
  shellManagersReady = true;

  const drawer = document.createElement('section');
  drawer.id = 'shell-drawer-root';
  drawer.className = 'ui-drawer shell-side-panel';
  drawer.setAttribute('aria-hidden', 'true');
  drawer.innerHTML = `
    <div class="ui-drawer-panel shell-side-panel-body" role="dialog" aria-modal="true" aria-labelledby="shell-drawer-title">
      <header class="ui-drawer-header">
        <div>
          <div class="shell-panel-eyebrow" id="shell-drawer-eyebrow">Meu Escritório</div>
          <h2 class="shell-panel-title" id="shell-drawer-title">Portal jurídico</h2>
        </div>
        <button type="button" class="shell-action-btn" data-shell-action="close-shell-drawer" aria-label="Fechar painel">
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
        </button>
      </header>
      <div class="ui-drawer-body" id="shell-drawer-content"></div>
    </div>
  `;
  document.body.appendChild(drawer);

  const modal = document.createElement('section');
  modal.id = 'shell-modal-root';
  modal.className = 'ui-modal shell-modal';
  modal.setAttribute('aria-hidden', 'true');
  modal.innerHTML = `
    <div class="ui-modal-panel" role="dialog" aria-modal="true" aria-labelledby="shell-modal-title">
      <header class="ui-modal-header">
        <h2 class="shell-panel-title" id="shell-modal-title">Portal jurídico</h2>
        <button type="button" class="shell-action-btn" data-shell-action="close-shell-modal" aria-label="Fechar modal">
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
        </button>
      </header>
      <div class="ui-modal-body" id="shell-modal-content"></div>
    </div>
  `;
  document.body.appendChild(modal);

  renderMobileWorkspaceNav();
  renderShellNotificationCount();

  window.shellDrawer = { open: openShellDrawer, close: closeShellDrawer };
  window.shellModal = { open: openShellModal, close: closeShellModal };
  window.shellNotify = addShellNotification;
}

function openShellDrawer({ title = 'Portal jurídico', eyebrow = 'Meu Escritório', body = '' } = {}) {
  ensureShellManagers();
  const drawer = document.getElementById('shell-drawer-root');
  const titleEl = document.getElementById('shell-drawer-title');
  const eyebrowEl = document.getElementById('shell-drawer-eyebrow');
  const contentEl = document.getElementById('shell-drawer-content');
  if (titleEl) titleEl.textContent = title;
  if (eyebrowEl) eyebrowEl.textContent = eyebrow;
  if (contentEl) contentEl.innerHTML = body;
  drawer?.classList.add('is-open');
  drawer?.setAttribute('aria-hidden', 'false');
  initUiKit(drawer || document);
  drawer?.querySelector('input, button, a')?.focus?.();
}

function closeShellDrawer() {
  const drawer = document.getElementById('shell-drawer-root');
  drawer?.classList.remove('is-open');
  drawer?.setAttribute('aria-hidden', 'true');
}

function openShellModal({ title = 'Portal jurídico', body = '' } = {}) {
  ensureShellManagers();
  const modal = document.getElementById('shell-modal-root');
  const titleEl = document.getElementById('shell-modal-title');
  const contentEl = document.getElementById('shell-modal-content');
  if (titleEl) titleEl.textContent = title;
  if (contentEl) contentEl.innerHTML = body;
  modal?.classList.add('is-open');
  modal?.setAttribute('aria-hidden', 'false');
  initUiKit(modal || document);
  modal?.querySelector('input, button, a')?.focus?.();
}

function closeShellModal() {
  const modal = document.getElementById('shell-modal-root');
  modal?.classList.remove('is-open');
  modal?.setAttribute('aria-hidden', 'true');
}

function renderAccountModal(view = 'conta') {
  const { user, caso, isAdmin } = appUserDetail || {};
  const display = getUserDisplayState(user, isAdmin);
  const activeView = ['perfil', 'conta', 'permissoes', 'preferencias'].includes(view) ? view : 'conta';
  const workspaceId = caso?.workspace_id || getActiveTenantId();
  const permissions = isAdmin
    ? ['Acesso administrativo', 'Gestao de modulos', 'Operacao multiworkspace']
    : ['Portal do cliente', 'Documentos do caso', 'Acompanhamento da jornada'];

  return `
    <section class="account-modal">
      <div class="account-modal-summary">
        <div class="header-avatar" aria-hidden="true">${escapeShellHtml(display.initials)}</div>
        <div>
          <h3>${escapeShellHtml(display.display)}</h3>
          <p>${escapeShellHtml(display.email || 'Conta autenticada no portal')}</p>
          <span class="ui-badge ui-badge-brand">${escapeShellHtml(display.roleLabel)}</span>
        </div>
      </div>
      <div class="account-modal-shortcuts">
        <button type="button" class="ui-btn ${activeView === 'perfil' ? 'ui-btn-primary' : 'ui-btn-ghost'}" data-shell-action="open-account-modal" data-account-view="perfil">Perfil</button>
        <button type="button" class="ui-btn ${activeView === 'conta' ? 'ui-btn-primary' : 'ui-btn-ghost'}" data-shell-action="open-account-modal" data-account-view="conta">Conta</button>
        <button type="button" class="ui-btn ${activeView === 'permissoes' ? 'ui-btn-primary' : 'ui-btn-ghost'}" data-shell-action="open-account-modal" data-account-view="permissoes">Permissoes</button>
        <button type="button" class="ui-btn ${activeView === 'preferencias' ? 'ui-btn-primary' : 'ui-btn-ghost'}" data-shell-action="open-account-modal" data-account-view="preferencias">Preferencias</button>
      </div>
      <div class="account-modal-grid">
        <article class="account-modal-card ${activeView === 'perfil' ? 'is-active' : ''}">
          <h4>Perfil</h4>
          <p>Nome exibido, email principal e papel atual no workspace.</p>
          <ul>
            <li><strong>Nome:</strong> ${escapeShellHtml(display.display)}</li>
            <li><strong>Email:</strong> ${escapeShellHtml(display.email || 'Nao informado')}</li>
            <li><strong>Papel:</strong> ${escapeShellHtml(display.roleLabel)}</li>
          </ul>
        </article>
        <article class="account-modal-card ${activeView === 'conta' ? 'is-active' : ''}">
          <h4>Conta</h4>
          <p>Contexto da conta e tenant ativo usado para isolar estado e preferencias.</p>
          <ul>
            <li><strong>Tenant:</strong> ${escapeShellHtml(workspaceId)}</li>
            <li><strong>Versao shell:</strong> ${escapeShellHtml(SHELL_VERSION)}</li>
            <li><strong>Rota atual:</strong> ${escapeShellHtml(getCurrentPage())}</li>
          </ul>
        </article>
        <article class="account-modal-card ${activeView === 'permissoes' ? 'is-active' : ''}">
          <h4>Permissoes</h4>
          <p>Escopo funcional ativo para esta sessao autenticada.</p>
          <ul>
            ${permissions.map(item => `<li>${escapeShellHtml(item)}</li>`).join('')}
          </ul>
        </article>
        <article class="account-modal-card ${activeView === 'preferencias' ? 'is-active' : ''}">
          <h4>Preferencias</h4>
          <p>Controles de visualizacao e produtividade do shell responsivo.</p>
          <ul>
            <li><strong>Sidebar:</strong> ${document.querySelector('.portal-shell')?.classList.contains('sidebar-collapsed') ? 'Recolhida' : 'Expandida'}</li>
            <li><strong>Modo:</strong> ${escapeShellHtml(getStoredViewMode())}</li>
            <li><strong>Notificacoes:</strong> ${getShellNotifications().length}</li>
          </ul>
        </article>
      </div>
    </section>
  `;
}

function openAccountModal(view = 'conta') {
  setAccountMenuOpen(false);
  openShellModal({
    title: 'Conta e configuracoes',
    body: renderAccountModal(view),
  });
}

function renderGlobalSearchPanel(query = '') {
  const normalized = query.trim().toLowerCase();
  const modules = getShellModules().filter(module => {
    const haystack = `${module.title} ${module.menuLabel || ''} ${module.key}`.toLowerCase();
    return !normalized || haystack.includes(normalized);
  });

  return `
    <div class="shell-search-panel">
      <label class="ui-field">
        <span class="ui-label">Buscar no portal</span>
        <span class="ui-search">
          <svg class="ui-search-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="9" cy="9" r="5.5" stroke="currentColor" stroke-width="1.6"/><path d="m13.2 13.2 3.1 3.1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
          <input class="ui-input" id="shell-global-search-input" type="search" value="${escapeShellHtml(query)}" placeholder="Documentos, dívidas, jornada, suporte" autocomplete="off">
        </span>
      </label>
      <div class="shell-panel-list" id="shell-global-search-results">
        ${modules.map(module => `
          <a class="shell-panel-item" href="${module.key}.html" data-page="${module.key}">
            <span class="shell-panel-item-icon">${getNavIcon(module.key)}</span>
            <span>
              <strong>${escapeShellHtml(module.menuLabel || module.title)}</strong>
              <small>${escapeShellHtml(module.title)}</small>
            </span>
          </a>
        `).join('') || '<div class="shell-empty-state">Nenhum módulo encontrado.</div>'}
      </div>
    </div>
  `;
}

function openGlobalSearchPanel() {
  openShellDrawer({
    eyebrow: 'Busca global',
    title: 'Encontrar módulo ou tarefa',
    body: renderGlobalSearchPanel(),
  });
  const input = document.getElementById('shell-global-search-input');
  input?.addEventListener('input', () => {
    const content = document.getElementById('shell-drawer-content');
    if (!content) return;
    content.innerHTML = renderGlobalSearchPanel(input.value);
    openGlobalSearchPanelBindOnly();
  });
  input?.focus?.();
}

function openGlobalSearchPanelBindOnly() {
  const input = document.getElementById('shell-global-search-input');
  input?.addEventListener('input', () => {
    const content = document.getElementById('shell-drawer-content');
    if (!content) return;
    content.innerHTML = renderGlobalSearchPanel(input.value);
    openGlobalSearchPanelBindOnly();
  });
  input?.focus?.();
}

function openNotificationsPanel() {
  openWorkspacePanel();
}

function renderLegalNotificationFilters() {
  const hasFilters = shellLegalNotificationFilters.types.length || shellLegalNotificationFilters.statuses.length;
  const typeButtons = Object.entries(LEGAL_NOTIFICATION_TYPES).map(([key, meta]) => {
    const active = shellLegalNotificationFilters.types.includes(key);
    return `
      <button type="button" class="shell-legal-filter ${active ? 'is-active' : ''}" data-legal-filter-kind="types" data-legal-filter-value="${key}" title="${escapeShellHtml(meta.label)}">
        <span class="shell-legal-filter-icon">${legalNotificationIcon(meta.icon)}</span>
        <span class="shell-legal-filter-label">${escapeShellHtml(meta.label)}</span>
        <span class="shell-legal-count">${countLegalNotifications('type', key)}</span>
      </button>
    `;
  }).join('');

  const statusButtons = Object.entries(LEGAL_NOTIFICATION_STATUSES).map(([key, meta]) => {
    const active = shellLegalNotificationFilters.statuses.includes(key);
    return `
      <button type="button" class="shell-legal-status is-${meta.tone} ${active ? 'is-active' : ''}" data-legal-filter-kind="statuses" data-legal-filter-value="${key}" title="${escapeShellHtml(meta.label)}">
        <span class="shell-legal-status-dot" aria-hidden="true"></span>
        <span class="shell-legal-status-label">${escapeShellHtml(meta.label)}</span>
        <span class="shell-legal-count">${countLegalNotifications('status', key)}</span>
      </button>
    `;
  }).join('');

  return `
    <div class="shell-legal-toolbar">
      <div class="shell-legal-toolbar-head">
        <span>Filtros</span>
        ${hasFilters ? '<button type="button" class="shell-legal-clear" data-legal-filter-clear>Limpar</button>' : ''}
      </div>
      <div>
        <div class="shell-panel-section-title">Tipo de interação</div>
        <div class="shell-legal-filter-grid" role="group" aria-label="Filtrar por tipo">${typeButtons}</div>
      </div>
      <div>
        <div class="shell-panel-section-title">Estado</div>
        <div class="shell-legal-status-grid" role="group" aria-label="Filtrar por estado">${statusButtons}</div>
      </div>
    </div>
  `;
}

function renderLegalNotificationList() {
  const items = getFilteredLegalNotifications();
  return `
    <div class="shell-panel-section-title">Interações</div>
    <div class="shell-panel-list">
      ${items.map(item => {
        const typeMeta = LEGAL_NOTIFICATION_TYPES[item.type] || LEGAL_NOTIFICATION_TYPES.notificacao;
        const statusMeta = LEGAL_NOTIFICATION_STATUSES[item.status] || LEGAL_NOTIFICATION_STATUSES.pendente;
        return `
          <button type="button" class="shell-panel-item shell-legal-notification-item" data-legal-notification-id="${escapeShellHtml(item.id)}" title="Abrir e marcar como lida">
            <span class="shell-panel-item-icon is-${escapeShellHtml(typeMeta.tone)}">${legalNotificationIcon(typeMeta.icon)}</span>
            <span>
              <strong>${escapeShellHtml(item.title)}</strong>
              <small>${escapeShellHtml(typeMeta.label)} · ${shellTimeAgo(new Date(item.createdAt).getTime())}</small>
              <small>${escapeShellHtml(item.text || 'Sem detalhes adicionais.')}</small>
            </span>
            <span class="shell-legal-status-pill is-${escapeShellHtml(statusMeta.tone)}" title="${escapeShellHtml(statusMeta.label)}">${escapeShellHtml(statusMeta.label)}</span>
          </button>
        `;
      }).join('') || '<div class="shell-empty-state">Nenhuma interação encontrada para os filtros selecionados.</div>'}
    </div>
  `;
}

function renderLegalNotificationDrawer({ loading = false } = {}) {
  const isAdmin = !!appUserDetail?.isAdmin;
  const total = shellLegalNotificationItems.length;
  const unread = shellLegalNotificationItems.filter(item => item.status === 'nao_lido').length;
  const pendingSignature = shellLegalNotificationItems.filter(item => item.status === 'pendente_assinatura').length;
  const pending = shellLegalNotificationItems.filter(item => ['nao_lido', 'pendente', 'pendente_assinatura'].includes(item.status)).length;

  return `
    <section class="shell-legal-center-hero">
      <div>
        <h3>${isAdmin ? 'Notificações jurídicas' : 'Pendências do seu caso'}</h3>
        <p>${isAdmin
          ? 'Acompanhe envio, leitura, ciência, comentários e assinaturas vinculados ao caso.'
          : 'Leia comunicados, confirme ciência e assine documentos quando solicitado.'}</p>
      </div>
    </section>

    <div class="shell-legal-kpis">
      <article><span>Total</span><strong>${total}</strong></article>
      <article><span>Não lidas</span><strong>${unread}</strong></article>
      <article><span>Assinaturas</span><strong>${pendingSignature}</strong></article>
      <article><span>Pendentes</span><strong>${pending}</strong></article>
    </div>

    ${renderLegalNotificationFilters()}
    ${loading ? '<div class="shell-empty-state">Carregando notificações...</div>' : renderLegalNotificationList()}
  `;
}

async function openWorkspacePanel({ reload = true } = {}) {
  if (reload) {
    openShellDrawer({
      eyebrow: 'Central jurídica',
      title: 'Notificações',
      body: renderLegalNotificationDrawer({ loading: true }),
    });
    await loadShellLegalNotifications();
  }

  openShellDrawer({
    eyebrow: 'Central jurídica',
    title: 'Notificações',
    body: renderLegalNotificationDrawer(),
  });
}

function clearLegalNotificationFilters() {
  shellLegalNotificationFilters.types = [];
  shellLegalNotificationFilters.statuses = [];
  const content = document.getElementById('shell-drawer-content');
  if (content) content.innerHTML = renderLegalNotificationDrawer();
}

async function openLegalNotificationDetail(id) {
  const item = shellLegalNotificationItems.find(entry => String(entry.id) === String(id));
  if (!item) return;

  if (item.status === 'nao_lido') {
    item.status = 'lido';
    item.readAt = new Date().toISOString();
    if (shellLegalNotificationSource === 'supabase') {
      LegalNotificationService.markRead(id).catch(error => {
        console.warn('[shell] mark notification read failed', error);
      });
    } else {
      const local = getShellNotifications().map(entry => entry.id === id ? { ...entry, read: true } : entry);
      setShellNotifications(local);
    }
  }

  const typeMeta = LEGAL_NOTIFICATION_TYPES[item.type] || LEGAL_NOTIFICATION_TYPES.notificacao;
  const statusMeta = LEGAL_NOTIFICATION_STATUSES[item.status] || LEGAL_NOTIFICATION_STATUSES.pendente;
  renderShellNotificationCount();
  openShellDrawer({
    eyebrow: typeMeta.label,
    title: item.title,
    body: `
      <article class="shell-legal-detail">
        <div class="shell-legal-detail-head">
          <span class="shell-panel-item-icon is-${escapeShellHtml(typeMeta.tone)}">${legalNotificationIcon(typeMeta.icon)}</span>
          <div>
            <strong>${escapeShellHtml(item.title)}</strong>
            <small>${escapeShellHtml(typeMeta.label)} · ${shellTimeAgo(new Date(item.createdAt).getTime())}</small>
          </div>
          <span class="shell-legal-status-pill is-${escapeShellHtml(statusMeta.tone)}" title="${escapeShellHtml(statusMeta.label)}">${escapeShellHtml(statusMeta.label)}</span>
        </div>
        <p>${escapeShellHtml(item.text || 'Sem conteúdo adicional registrado.')}</p>
        <dl>
          <div><dt>Ciência</dt><dd>${item.requiresAck ? 'Solicitada' : 'Não exigida'}</dd></div>
          <div><dt>Comentário</dt><dd>${item.requiresComment ? 'Solicitado' : 'Opcional'}</dd></div>
          <div><dt>Assinatura</dt><dd>${item.requiresSignature ? 'Obrigatória' : 'Não exigida'}</dd></div>
        </dl>
        <div class="shell-panel-actions">
          <button type="button" class="ui-btn ui-btn-ghost ui-btn-full" data-shell-action="workspace-panel">Voltar às notificações</button>
          ${item.documentId ? '<a class="ui-btn ui-btn-primary ui-btn-full" href="documentos.html" data-page="documentos">Abrir documento</a>' : ''}
        </div>
      </article>
    `,
  });
}

function renderMobileWorkspaceNav() {
  let dock = document.getElementById('shell-mobile-nav');
  if (!dock) {
    dock = document.createElement('nav');
    dock.id = 'shell-mobile-nav';
    dock.className = 'shell-mobile-nav';
    dock.setAttribute('aria-label', 'Navegação rápida');
    document.body.appendChild(dock);
  }

  const preferred = getEffectiveIsAdmin()
    ? ['painel', 'documentos', 'processos', 'analytics']
    : ['meu-caso', 'onboarding-v2', 'meus-documentos', 'suporte'];
  const modules = getShellModules().filter(module => preferred.includes(module.key));
  dock.innerHTML = modules.map(module => `
    <a href="${module.key}.html" data-page="${module.key}" class="shell-mobile-nav-link">
      ${getNavIcon(module.key)}
      <span>${escapeShellHtml(module.menuLabel || module.title)}</span>
    </a>
  `).join('');
  const current = getCurrentPage();
  dock.querySelectorAll('.shell-mobile-nav-link').forEach(link => {
    const active = link.dataset.page === current;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}

/* ── Init ────────────────────────────────────────── */
async function init() {
  captureModuleListeners = false;
  await bootPortalShell();
}

nativeDocumentAddEventListener('DOMContentLoaded', init);
window.addEventListener(VIEW_MODE_EVENT, () => {
  syncShellViewMode({ navigateOnMismatch: true, source: 'view-mode-event' });
});
