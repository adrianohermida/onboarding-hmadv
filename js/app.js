import { Router }      from './router.js';
import { AuthService }  from '../services/auth.js';
import { showToast }    from '../utils/helpers.js';

const BASE = window.location.pathname.includes('/pages/') ? '../' : './';

/* ── Páginas públicas (sem guard) ─────────────── */
const PUBLIC_PAGES = ['login', 'auth-callback'];

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
  await Promise.all([
    loadComponent('[data-component="sidebar"]', 'components/sidebar.html'),
    loadComponent('[data-component="header"]',  'components/header.html'),
  ]);
}

async function loadUser() {
  const user = await AuthService.getUser();
  if (!user) return;
  document.dispatchEvent(new CustomEvent('app:user-loaded', { detail: user }));
}

function initRouter() {
  const router = new Router();
  router.setActiveLink();
  router.updateBreadcrumb();
}

function initToast() {
  if (!document.getElementById('toast')) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.id = 'toast';
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
}

document.addEventListener('DOMContentLoaded', init);
