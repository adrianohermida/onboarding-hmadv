import { Router }                    from './router.js';
import { AuthService }               from '../services/auth.js';
import { showToast }                 from '../utils/helpers.js';
import { CaseService, checkIsAdmin } from '../services/database.js';

const BASE = window.location.pathname.includes('/pages/') ? '../' : './';

const PUBLIC_PAGES = ['login', 'auth-callback'];

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

  // Setup mobile sidebar toggle (CSS controls visibility — no JS display override needed)
  const toggle = document.getElementById('sidebar-toggle');
  const sidebar = document.querySelector('.sidebar');
  if (toggle && sidebar) {
    toggle.addEventListener('click', () => sidebar.classList.toggle('sidebar-open'));
    document.addEventListener('click', e => {
      if (sidebar.classList.contains('sidebar-open') &&
          !sidebar.contains(e.target) && e.target !== toggle) {
        sidebar.classList.remove('sidebar-open');
      }
    });
  }

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
    btn.addEventListener('click', () => {
      document.getElementById(btn.dataset.modalClose)?.classList.remove('show');
    });
  });
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
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

  initRouter();
  initToast();
  setTimeout(initModalClose, 100);

  window.showToast = showToast;
  document.dispatchEvent(new CustomEvent('app:ready'));

  // Reveal page after everything loaded (removes skeleton shimmer)
  document.body.classList.add('app-loaded');
}

document.addEventListener('DOMContentLoaded', init);
