export const FEATURE_FLAGS = {
  dashboard: true,
  meuCaso: true,
  meusDocumentos: true,
  minhasDividas: true,
  meuPlano: true,
  mensagensCliente: true,
  ajuda: true,
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
  analytics: true,
  aiCopilot: true,
  clientExperience: true,
  financialIntelligence: true,
  legalOperations: true,
  compliance: true,
  platformOs: true,
  uiOs: true,
  workspaceOs: true,
  billingOs: true,
};

export const PORTAL_MODULES = [
  { key: 'meu-caso', title: 'Meu Caso', menuLabel: 'Meu caso', parent: null, order: 10, visible: true, roles: ['cliente'], feature: 'meuCaso', icon: 'heart-handshake' },
  { key: 'meus-documentos', title: 'Meus Documentos', menuLabel: 'Documentos', parent: 'Meu Caso', order: 20, visible: true, roles: ['cliente'], feature: 'meusDocumentos', icon: 'file-text' },
  { key: 'minhas-dividas', title: 'Minhas Dividas', menuLabel: 'Dividas', parent: 'Meu Caso', order: 30, visible: true, roles: ['cliente'], feature: 'minhasDividas', icon: 'credit-card' },
  { key: 'meu-plano', title: 'Meu Plano', menuLabel: 'Meu plano', parent: 'Meu Caso', order: 40, visible: true, roles: ['cliente'], feature: 'meuPlano', icon: 'map' },
  { key: 'mensagens', title: 'Mensagens', menuLabel: 'Mensagens', parent: 'Meu Caso', order: 90, clientOrder: 50, adminOrder: 90, visible: true, roles: ['cliente', 'admin'], feature: 'mensagensCliente', icon: 'message-square' },
  { key: 'ajuda', title: 'Ajuda', menuLabel: 'Ajuda', parent: 'Meu Caso', order: 60, visible: true, roles: ['cliente'], feature: 'ajuda', icon: 'circle-help' },
  { key: 'dashboard', title: 'Dashboard', menuLabel: 'Inicio', parent: null, order: 500, visible: false, roles: ['cliente'], feature: 'dashboard', icon: 'layout-dashboard' },
  { key: 'painel', title: 'Painel do Advogado', menuLabel: 'Painel', parent: null, order: 10, visible: true, roles: ['admin'], feature: 'painel', icon: 'briefcase' },
  { key: 'clientes', title: 'Clientes', menuLabel: 'Clientes', parent: 'Painel', order: 20, visible: true, roles: ['admin'], feature: 'clientes', icon: 'users' },
  { key: 'onboarding-v2', title: 'Jornada CNJ', menuLabel: 'Jornada', parent: 'Meu Caso', order: 510, visible: false, roles: ['cliente'], feature: 'onboardingV2', icon: 'route' },
  { key: 'financial-dashboard', title: 'Diagnostico Financeiro', menuLabel: 'Financas', parent: 'Meu Plano', order: 520, visible: false, roles: ['cliente'], feature: 'financialDashboard', icon: 'chart-column' },
  { key: 'documentos', title: 'Documentos', menuLabel: 'Documentos', parent: 'Painel', order: 30, visible: true, roles: ['admin'], feature: 'documentos', icon: 'file-text' },
  { key: 'dividas', title: 'Dividas', menuLabel: 'Dividas', parent: 'Painel', order: 40, visible: true, roles: ['admin'], feature: 'dividas', icon: 'credit-card' },
  { key: 'planos', title: 'Planos', menuLabel: 'Planos', parent: 'Painel', order: 50, visible: true, roles: ['admin'], feature: 'planos', icon: 'landmark' },
  { key: 'processos', title: 'Processos', menuLabel: 'Processos', parent: 'Painel', order: 60, visible: true, roles: ['admin'], feature: 'processos', icon: 'scale' },
  { key: 'tarefas', title: 'Tarefas', menuLabel: 'Tarefas', parent: 'Painel', order: 70, visible: true, roles: ['admin'], feature: 'tarefas', icon: 'check-square' },
  { key: 'agenda', title: 'Agenda', menuLabel: 'Agenda', parent: 'Painel', order: 80, visible: true, roles: ['admin'], feature: 'agenda', icon: 'calendar-days' },
  { key: 'mensagens-admin', title: 'Mensagens', menuLabel: 'Mensagens', parent: 'Painel', order: 90, visible: false, roles: ['admin'], feature: 'mensagens', icon: 'message-square' },
  { key: 'financeiro', title: 'Financeiro', menuLabel: 'Financeiro', parent: 'Painel', order: 100, visible: true, roles: ['admin'], feature: 'financeiro', icon: 'wallet' },
  { key: 'analytics', title: 'Analytics', menuLabel: 'Analytics', parent: 'Painel', order: 110, visible: true, roles: ['admin'], feature: 'analytics', icon: 'chart-scatter' },
  { key: 'ai-copilot', title: 'AI Copilot', menuLabel: 'AI Copilot', parent: 'Painel', order: 120, visible: true, roles: ['admin'], feature: 'aiCopilot', icon: 'sparkles' },
  { key: 'experiencia-cliente', title: 'Experiência do Cliente', menuLabel: 'Cliente+', parent: 'Painel', order: 130, visible: true, roles: ['admin'], feature: 'clientExperience', icon: 'heart-handshake' },
  { key: 'financeiro-inteligencia', title: 'Financeiro Inteligente', menuLabel: 'FinOps', parent: 'Painel', order: 140, visible: true, roles: ['admin'], feature: 'financialIntelligence', icon: 'brain-circuit' },
  { key: 'operacoes-juridicas', title: 'Operações Jurídicas', menuLabel: 'Operações', parent: 'Painel', order: 150, visible: true, roles: ['admin'], feature: 'legalOperations', icon: 'scale' },
  { key: 'compliance', title: 'Compliance', menuLabel: 'Compliance', parent: 'Painel', order: 160, visible: true, roles: ['admin'], feature: 'compliance', icon: 'shield-check' },
  { key: 'platform-os', title: 'Platform OS', menuLabel: 'Platform OS', parent: 'Painel', order: 170, visible: true, roles: ['admin'], feature: 'platformOs', icon: 'server' },
  { key: 'ui-os', title: 'UI OS', menuLabel: 'UI OS', parent: 'Painel', order: 180, visible: true, roles: ['admin'], feature: 'uiOs', icon: 'layout-panel-top' },
  { key: 'workspace-os', title: 'Workspace OS', menuLabel: 'Workspace OS', parent: 'Painel', order: 190, visible: true, roles: ['admin'], feature: 'workspaceOs', icon: 'panel-left-open' },
  { key: 'billing-os', title: 'Billing OS', menuLabel: 'Billing OS', parent: 'Painel', order: 200, visible: true, roles: ['admin'], feature: 'billingOs', icon: 'receipt' },
  { key: 'suporte', title: 'Suporte', menuLabel: 'Suporte', parent: 'Meu Caso', order: 530, visible: false, roles: ['cliente'], feature: 'suporte', icon: 'circle-help' },
  { key: 'onboarding', title: 'Formulario', menuLabel: 'Formulario', parent: 'Meu Caso', order: 540, visible: false, roles: ['cliente'], feature: 'onboardingLegacy', icon: 'clipboard-list' },
  { key: 'login', title: 'Acesso', menuLabel: 'Acesso', parent: null, order: 999, visible: false, roles: ['public'], icon: 'log-in' },
  { key: 'auth-callback', title: 'Autenticacao', menuLabel: 'Autenticacao', parent: null, order: 1000, visible: false, roles: ['public'], icon: 'shield-check' },
];

function readTenantFeatureOverrides() {
  if (typeof window === 'undefined') return null;

  if (window.__portalTenantConfig?.featureFlags && typeof window.__portalTenantConfig.featureFlags === 'object') {
    return window.__portalTenantConfig.featureFlags;
  }

  try {
    const raw = sessionStorage.getItem('portal:tenant-config');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.featureFlags && typeof parsed.featureFlags === 'object'
      ? parsed.featureFlags
      : null;
  } catch (_) {
    return null;
  }
}

export function resolveFeatureFlags(featureFlags = null) {
  return {
    ...FEATURE_FLAGS,
    ...(readTenantFeatureOverrides() || {}),
    ...(featureFlags || {}),
  };
}

export function getModule(key) {
  return PORTAL_MODULES.find(module => module.key === key) || null;
}

export function getRoutes() {
  return Object.fromEntries(
    PORTAL_MODULES.map(module => [module.key, { title: module.title, parent: module.parent }])
  );
}

export function getSidebarModules({ isAdmin = false, featureFlags = null } = {}) {
  const role = isAdmin ? 'admin' : 'cliente';
  const resolvedFlags = resolveFeatureFlags(featureFlags);
  return PORTAL_MODULES
    .filter(module => module.visible)
    .filter(module => module.roles.includes(role))
    .filter(module => !module.feature || resolvedFlags[module.feature] === true)
    .sort((a, b) => {
      const orderKey = isAdmin ? 'adminOrder' : 'clientOrder';
      return (a[orderKey] ?? a.order) - (b[orderKey] ?? b.order);
    });
}
