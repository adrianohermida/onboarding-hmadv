export class Router {
  constructor() {
    this.modules = [
      { key: 'dashboard', title: 'Dashboard', menuLabel: 'Inicio', parent: null, order: 10, visible: true, roles: ['cliente', 'admin'] },
      { key: 'onboarding-v2', title: 'Jornada CNJ', menuLabel: 'Jornada', parent: 'Dashboard', order: 20, visible: true, roles: ['cliente', 'admin'] },
      { key: 'financial-dashboard', title: 'Diagnostico Financeiro', menuLabel: 'Financas', parent: 'Dashboard', order: 30, visible: true, roles: ['cliente', 'admin'] },
      { key: 'documentos', title: 'Documentos', menuLabel: 'Documentos', parent: 'Dashboard', order: 40, visible: true, roles: ['cliente', 'admin'] },
      { key: 'dividas', title: 'Dividas', menuLabel: 'Dividas', parent: 'Dashboard', order: 50, visible: true, roles: ['cliente', 'admin'] },
      { key: 'suporte', title: 'Suporte', menuLabel: 'Suporte', parent: 'Dashboard', order: 60, visible: true, roles: ['cliente', 'admin'] },
      { key: 'onboarding', title: 'Formulario', menuLabel: 'Formulario', parent: 'Dashboard', order: 70, visible: true, roles: ['cliente', 'admin'] },
      { key: 'login', title: 'Acesso', menuLabel: 'Acesso', parent: null, order: 999, visible: false, roles: ['public'] },
      { key: 'auth-callback', title: 'Autenticacao', menuLabel: 'Autenticacao', parent: null, order: 1000, visible: false, roles: ['public'] },
    ];

    this.routes = Object.fromEntries(
      this.modules.map(m => [m.key, { title: m.title, parent: m.parent }])
    );
  }

  getModule(key) {
    return this.modules.find(m => m.key === key) || null;
  }

  getSidebarModules({ isAdmin = false } = {}) {
    const role = isAdmin ? 'admin' : 'cliente';
    return this.modules
      .filter(m => m.visible)
      .filter(m => m.roles.includes(role))
      .sort((a, b) => a.order - b.order);
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
