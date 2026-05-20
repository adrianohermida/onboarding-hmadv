export class Router {
  constructor() {
    this.routes = {
      'login':      { title: 'Acesso',          parent: null },
      'dashboard':  { title: 'Dashboard',        parent: null },
      'onboarding': { title: 'Onboarding',       parent: 'Dashboard' },
      'documentos': { title: 'Documentos',        parent: 'Dashboard' },
      'dividas':    { title: 'Dívidas',           parent: 'Dashboard' },
    };
  }

  getCurrentPage() {
    const path = window.location.pathname;
    const file = path.split('/').pop().replace('.html', '') || 'dashboard';
    return file === '' ? 'dashboard' : file;
  }

  setActiveLink() {
    const current = this.getCurrentPage();
    document.querySelectorAll('.nav-link').forEach(link => {
      const href = link.getAttribute('href') || '';
      const name = href.replace('.html', '').split('/').pop();
      if (name === current) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      } else {
        link.classList.remove('active');
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
