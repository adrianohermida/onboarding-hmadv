import { Router }                    from './router.js';
import { AuthService }               from '../services/auth.js';
import { showToast }                 from '../utils/helpers.js';
import { CaseService, checkIsAdmin } from '../services/database.js';

const BASE = window.location.pathname.includes('/pages/') ? '../' : './';

const PUBLIC_PAGES = ['login', 'auth-callback'];
const SHELL_SCRIPT_ATTR = 'data-shell-page-script';
const SHELL_STYLE_ATTR = 'data-shell-page-style';

let appUserDetail = null;
let shellNavInFlight = false;

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
    link.href = absHref;
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

  parsedDoc.querySelectorAll('.modal-overlay, .toast').forEach(node => {
    const clone = node.cloneNode(true);
    clone.setAttribute('data-shell-dynamic', '1');
    document.body.appendChild(clone);
  });

  return true;
}

async function runPageScripts(parsedDoc, targetUrl) {
  const scripts = [...parsedDoc.querySelectorAll('script[type="module"]')]
    .filter(s => {
      const src = s.getAttribute('src') || '';
      return !src.endsWith('/js/app.js') && !src.endsWith('js/app.js');
    });

  for (const script of scripts) {
    const el = document.createElement('script');
    el.type = 'module';
    el.setAttribute(SHELL_SCRIPT_ATTR, '1');

    const src = script.getAttribute('src');
    if (src) {
      el.src = new URL(src, targetUrl).toString();
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
}

async function navigateModule(url, { pushState = true } = {}) {
  if (shellNavInFlight) return;
  shellNavInFlight = true;

  const absolute = toAbsoluteUrl(url);

  try {
    const res = await fetch(absolute, { credentials: 'same-origin' });
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
  const sidebar = document.querySelector('.sidebar');
  if (!toggle || !sidebar) return;

  let overlay = document.getElementById('sidebar-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'sidebar-overlay';
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.background = 'rgba(0,0,0,.35)';
    overlay.style.zIndex = '250';
    overlay.style.opacity = '0';
    overlay.style.pointerEvents = 'none';
    overlay.style.transition = 'opacity .2s ease';
    document.body.appendChild(overlay);
  }

  const closeSidebar = () => {
    sidebar.classList.remove('sidebar-open');
    overlay.style.opacity = '0';
    overlay.style.pointerEvents = 'none';
    document.body.style.overflow = '';
  };

  const openSidebar = () => {
    sidebar.classList.add('sidebar-open');
    overlay.style.opacity = '1';
    overlay.style.pointerEvents = 'auto';
    document.body.style.overflow = 'hidden';
  };

  toggle.addEventListener('click', e => {
    e.stopPropagation();
    if (sidebar.classList.contains('sidebar-open')) closeSidebar();
    else openSidebar();
  });

  overlay.addEventListener('click', closeSidebar);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeSidebar();
  });
  document.addEventListener('app:route-changed', closeSidebar);
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

document.addEventListener('DOMContentLoaded', init);
