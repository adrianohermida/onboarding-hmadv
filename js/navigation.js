export const FEATURE_FLAGS = {
  dashboard: true,
  painel: true,
  clientes: true,
  onboardingV2: true,
  financialDashboard: true,
  documentos: true,
  dividas: true,
  planos: true,
  processos: true,
  tarefas: true,
  agenda: true,
  mensagens: true,
  financeiro: true,
  suporte: true,
  onboardingLegacy: true,
};

export const PORTAL_MODULES = [
  { key: 'dashboard', title: 'Dashboard', menuLabel: 'Inicio', parent: null, order: 10, visible: true, roles: ['cliente'], feature: 'dashboard', icon: 'layout-dashboard' },
  { key: 'painel', title: 'Painel do Advogado', menuLabel: 'Painel', parent: null, order: 10, visible: true, roles: ['admin'], feature: 'painel', icon: 'briefcase' },
  { key: 'clientes', title: 'Clientes', menuLabel: 'Clientes', parent: 'Painel', order: 20, visible: true, roles: ['admin'], feature: 'clientes', icon: 'users' },
  { key: 'onboarding-v2', title: 'Jornada CNJ', menuLabel: 'Jornada', parent: 'Dashboard', order: 20, visible: true, roles: ['cliente'], feature: 'onboardingV2', icon: 'route' },
  { key: 'financial-dashboard', title: 'Diagnostico Financeiro', menuLabel: 'Financas', parent: 'Dashboard', order: 30, visible: true, roles: ['cliente'], feature: 'financialDashboard', icon: 'chart-column' },
  { key: 'documentos', title: 'Documentos', menuLabel: 'Documentos', parent: 'Painel', order: 30, visible: true, roles: ['cliente', 'admin'], feature: 'documentos', icon: 'file-text' },
  { key: 'dividas', title: 'Dividas', menuLabel: 'Dividas', parent: 'Painel', order: 40, visible: true, roles: ['cliente', 'admin'], feature: 'dividas', icon: 'credit-card' },
  { key: 'planos', title: 'Planos', menuLabel: 'Planos', parent: 'Painel', order: 50, visible: true, roles: ['admin'], feature: 'planos', icon: 'landmark' },
  { key: 'processos', title: 'Processos', menuLabel: 'Processos', parent: 'Painel', order: 60, visible: true, roles: ['admin'], feature: 'processos', icon: 'scale' },
  { key: 'tarefas', title: 'Tarefas', menuLabel: 'Tarefas', parent: 'Painel', order: 70, visible: true, roles: ['admin'], feature: 'tarefas', icon: 'check-square' },
  { key: 'agenda', title: 'Agenda', menuLabel: 'Agenda', parent: 'Painel', order: 80, visible: true, roles: ['admin'], feature: 'agenda', icon: 'calendar-days' },
  { key: 'mensagens', title: 'Mensagens', menuLabel: 'Mensagens', parent: 'Painel', order: 90, visible: true, roles: ['admin'], feature: 'mensagens', icon: 'message-square' },
  { key: 'financeiro', title: 'Financeiro', menuLabel: 'Financeiro', parent: 'Painel', order: 100, visible: true, roles: ['admin'], feature: 'financeiro', icon: 'wallet' },
  { key: 'suporte', title: 'Suporte', menuLabel: 'Suporte', parent: 'Dashboard', order: 60, visible: true, roles: ['cliente'], feature: 'suporte', icon: 'circle-help' },
  { key: 'onboarding', title: 'Formulario', menuLabel: 'Formulario', parent: 'Dashboard', order: 70, visible: true, roles: ['cliente'], feature: 'onboardingLegacy', icon: 'clipboard-list' },
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
