export const FEATURE_FLAGS = {
  dashboard: true,
  onboardingV2: true,
  financialDashboard: true,
  documentos: true,
  dividas: true,
  suporte: true,
  onboardingLegacy: true,
};

export const PORTAL_MODULES = [
  { key: 'dashboard', title: 'Dashboard', menuLabel: 'Inicio', parent: null, order: 10, visible: true, roles: ['cliente', 'admin'], feature: 'dashboard', icon: 'layout-dashboard' },
  { key: 'onboarding-v2', title: 'Jornada CNJ', menuLabel: 'Jornada', parent: 'Dashboard', order: 20, visible: true, roles: ['cliente', 'admin'], feature: 'onboardingV2', icon: 'route' },
  { key: 'financial-dashboard', title: 'Diagnostico Financeiro', menuLabel: 'Financas', parent: 'Dashboard', order: 30, visible: true, roles: ['cliente', 'admin'], feature: 'financialDashboard', icon: 'chart-column' },
  { key: 'documentos', title: 'Documentos', menuLabel: 'Documentos', parent: 'Dashboard', order: 40, visible: true, roles: ['cliente', 'admin'], feature: 'documentos', icon: 'file-text' },
  { key: 'dividas', title: 'Dividas', menuLabel: 'Dividas', parent: 'Dashboard', order: 50, visible: true, roles: ['cliente', 'admin'], feature: 'dividas', icon: 'credit-card' },
  { key: 'suporte', title: 'Suporte', menuLabel: 'Suporte', parent: 'Dashboard', order: 60, visible: true, roles: ['cliente', 'admin'], feature: 'suporte', icon: 'circle-help' },
  { key: 'onboarding', title: 'Formulario', menuLabel: 'Formulario', parent: 'Dashboard', order: 70, visible: true, roles: ['cliente', 'admin'], feature: 'onboardingLegacy', icon: 'clipboard-list' },
  { key: 'login', title: 'Acesso', menuLabel: 'Acesso', parent: null, order: 999, visible: false, roles: ['public'], icon: 'log-in' },
  { key: 'auth-callback', title: 'Autenticacao', menuLabel: 'Autenticacao', parent: null, order: 1000, visible: false, roles: ['public'], icon: 'shield-check' },
];

export function getModule(key) {
  return PORTAL_MODULES.find(module => module.key === key) || null;
}

export function getRoutes() {
  return Object.fromEntries(
    PORTAL_MODULES.map(module => [module.key, { title: module.title, parent: module.parent }])
  );
}

export function getSidebarModules({ isAdmin = false, featureFlags = FEATURE_FLAGS } = {}) {
  const role = isAdmin ? 'admin' : 'cliente';
  return PORTAL_MODULES
    .filter(module => module.visible)
    .filter(module => module.roles.includes(role))
    .filter(module => !module.feature || featureFlags[module.feature] === true)
    .sort((a, b) => a.order - b.order);
}
