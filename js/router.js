import { FEATURE_FLAGS, PORTAL_MODULES, getModule, getRoutes, getSidebarModules } from './navigation.js';

export class Router {
  constructor() {
    this.featureFlags = { ...FEATURE_FLAGS };
    this.modules = PORTAL_MODULES;
    this.routes = getRoutes();
  }

  getModule(key) {
    return getModule(key);
  }

  getSidebarModules({ isAdmin = false } = {}) {
    return getSidebarModules({ isAdmin, featureFlags: this.featureFlags });
  }

  getCurrentPage() {
    const path = window.location.pathname;
    const file = path.split('/').pop().replace('.html', '') || 'meu-caso';
    return file === '' ? 'meu-caso' : file;
  }

  setActiveLink() {
    const current = this.getCurrentPage();
    document.querySelectorAll('.nav-link').forEach(link => {
      const href = link.getAttribute('href') || '';
      const name = link.dataset.page || href.replace('.html', '').split('/').pop();
      if (name === current) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      } else {
        link.classList.remove('active');
        link.removeAttribute('aria-current');
      }
    });
  }

  updateBreadcrumb() {
    const current = this.getCurrentPage();
    const route   = this.routes[current];
    if (!route) return;

    const el = document.querySelector('.header-breadcrumb');
    if (!el) return;

    if (route.parent) {
      el.innerHTML = `<span>${route.parent}</span> <span>/</span> <strong>${route.title}</strong>`;
    } else {
      el.innerHTML = `<strong>${route.title}</strong>`;
    }
  }

  navigate(page) {
    const base = window.location.pathname.includes('/pages/') ? '' : 'pages/';
    window.location.href = base + page + '.html';
  }
}
