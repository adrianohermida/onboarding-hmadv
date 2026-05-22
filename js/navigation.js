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
  { key: 'meu-caso', title: 'Meu Caso', menuLabel: 'Meu caso', parent: null, order: 10, visible: true, roles: ['cliente'], feature: 'meuCaso', icon: 'heart-handshake', sidebarSection: 'caso', sidebarSectionLabel: 'Meu caso', sidebarSectionOrder: 10 },
  { key: 'meus-documentos', title: 'Meus Documentos', menuLabel: 'Documentos', parent: 'Meu Caso', order: 20, visible: true, roles: ['cliente'], feature: 'meusDocumentos', icon: 'file-text', sidebarSection: 'caso', sidebarSectionLabel: 'Meu caso', sidebarSectionOrder: 10 },
  { key: 'minhas-dividas', title: 'Minhas Dividas', menuLabel: 'Dividas', parent: 'Meu Caso', order: 30, visible: true, roles: ['cliente'], feature: 'minhasDividas', icon: 'credit-card', sidebarSection: 'caso', sidebarSectionLabel: 'Meu caso', sidebarSectionOrder: 10 },
  { key: 'meu-plano', title: 'Meu Plano', menuLabel: 'Meu plano', parent: 'Meu Caso', order: 40, visible: true, roles: ['cliente'], feature: 'meuPlano', icon: 'map', sidebarSection: 'caso', sidebarSectionLabel: 'Meu caso', sidebarSectionOrder: 10 },
  { key: 'mensagens', title: 'Mensagens', menuLabel: 'Mensagens', parent: 'Meu Caso', order: 90, clientOrder: 50, adminOrder: 90, visible: true, roles: ['cliente', 'admin'], feature: 'mensagensCliente', icon: 'message-square', sidebarSection: 'caso', sidebarSectionLabel: 'Meu caso', sidebarSectionOrder: 10 },
  { key: 'ajuda', title: 'Ajuda', menuLabel: 'Ajuda', parent: 'Meu Caso', order: 60, visible: true, roles: ['cliente'], feature: 'ajuda', icon: 'circle-help', sidebarSection: 'caso', sidebarSectionLabel: 'Meu caso', sidebarSectionOrder: 10 },
  { key: 'dashboard', title: 'Dashboard', menuLabel: 'Inicio', parent: null, order: 500, visible: false, roles: ['cliente'], feature: 'dashboard', icon: 'layout-dashboard' },
  { key: 'painel', title: 'Painel do Advogado', menuLabel: 'Painel', parent: null, order: 10, visible: true, roles: ['admin'], feature: 'painel', icon: 'briefcase', sidebarSection: 'operacao', sidebarSectionLabel: 'Operacao diaria', sidebarSectionOrder: 10 },
  { key: 'clientes', title: 'Clientes', menuLabel: 'Clientes', parent: 'Painel', order: 20, visible: true, roles: ['admin'], feature: 'clientes', icon: 'users', sidebarSection: 'operacao', sidebarSectionLabel: 'Operacao diaria', sidebarSectionOrder: 10 },
  { key: 'onboarding-v2', title: 'Jornada CNJ', menuLabel: 'Jornada', parent: 'Meu Caso', order: 510, visible: true, roles: ['cliente'], feature: 'onboardingV2', icon: 'route', sidebarSection: 'jornada', sidebarSectionLabel: 'Jornada e suporte', sidebarSectionOrder: 20 },
  { key: 'financial-dashboard', title: 'Diagnóstico Financeiro', menuLabel: 'Diagnóstico', parent: 'Meu Plano', order: 520, visible: true, roles: ['cliente'], feature: 'financialDashboard', icon: 'chart-column', sidebarSection: 'jornada', sidebarSectionLabel: 'Jornada e suporte', sidebarSectionOrder: 20 },
  { key: 'documentos', title: 'Documentos', menuLabel: 'Documentos', parent: 'Painel', order: 30, visible: true, roles: ['admin'], feature: 'documentos', icon: 'file-text', sidebarSection: 'operacao', sidebarSectionLabel: 'Operacao diaria', sidebarSectionOrder: 10 },
  { key: 'dividas', title: 'Dividas', menuLabel: 'Dividas', parent: 'Painel', order: 40, visible: true, roles: ['admin'], feature: 'dividas', icon: 'credit-card', sidebarSection: 'operacao', sidebarSectionLabel: 'Operacao diaria', sidebarSectionOrder: 10 },
  { key: 'planos', title: 'Planos', menuLabel: 'Planos', parent: 'Painel', order: 50, visible: true, roles: ['admin'], feature: 'planos', icon: 'landmark', sidebarSection: 'operacao', sidebarSectionLabel: 'Operacao diaria', sidebarSectionOrder: 10 },
  { key: 'processos', title: 'Processos', menuLabel: 'Processos', parent: 'Painel', order: 60, visible: true, roles: ['admin'], feature: 'processos', icon: 'scale', sidebarSection: 'operacao', sidebarSectionLabel: 'Operacao diaria', sidebarSectionOrder: 10 },
  { key: 'tarefas', title: 'Tarefas', menuLabel: 'Tarefas', parent: 'Painel', order: 70, visible: true, roles: ['admin'], feature: 'tarefas', icon: 'check-square', sidebarSection: 'operacao', sidebarSectionLabel: 'Operacao diaria', sidebarSectionOrder: 10 },
  { key: 'agenda', title: 'Agenda', menuLabel: 'Agenda', parent: 'Painel', order: 80, visible: true, roles: ['admin'], feature: 'agenda', icon: 'calendar-days', sidebarSection: 'operacao', sidebarSectionLabel: 'Operacao diaria', sidebarSectionOrder: 10 },
  { key: 'mensagens-admin', title: 'Mensagens', menuLabel: 'Mensagens', parent: 'Painel', order: 90, visible: false, roles: ['admin'], feature: 'mensagens', icon: 'message-square', sidebarSection: 'operacao', sidebarSectionLabel: 'Operacao diaria', sidebarSectionOrder: 10 },
  { key: 'financeiro', title: 'Financeiro', menuLabel: 'Financeiro', parent: 'Painel', order: 100, visible: true, roles: ['admin'], feature: 'financeiro', icon: 'wallet', sidebarSection: 'operacao', sidebarSectionLabel: 'Operacao diaria', sidebarSectionOrder: 10 },
  { key: 'analytics', title: 'Analytics', menuLabel: 'Analytics', parent: 'Painel', order: 110, visible: true, roles: ['admin'], feature: 'analytics', icon: 'chart-scatter', sidebarSection: 'inteligencia', sidebarSectionLabel: 'Inteligencia e experiencia', sidebarSectionOrder: 20 },
  { key: 'ai-copilot', title: 'AI Copilot', menuLabel: 'Copilot', parent: 'Painel', order: 120, visible: true, roles: ['admin'], feature: 'aiCopilot', icon: 'sparkles', sidebarSection: 'inteligencia', sidebarSectionLabel: 'Inteligencia e experiencia', sidebarSectionOrder: 20 },
  { key: 'experiencia-cliente', title: 'Experiência do Cliente', menuLabel: 'Experiencia', parent: 'Painel', order: 130, visible: true, roles: ['admin'], feature: 'clientExperience', icon: 'heart-handshake', sidebarSection: 'inteligencia', sidebarSectionLabel: 'Inteligencia e experiencia', sidebarSectionOrder: 20 },
  { key: 'financeiro-inteligencia', title: 'Financeiro Inteligente', menuLabel: 'Financeiro IA', parent: 'Painel', order: 140, visible: true, roles: ['admin'], feature: 'financialIntelligence', icon: 'brain-circuit', sidebarSection: 'inteligencia', sidebarSectionLabel: 'Inteligencia e experiencia', sidebarSectionOrder: 20 },
  { key: 'operacoes-juridicas', title: 'Operações Jurídicas', menuLabel: 'Operacoes', parent: 'Painel', order: 150, visible: true, roles: ['admin'], feature: 'legalOperations', icon: 'scale', sidebarSection: 'inteligencia', sidebarSectionLabel: 'Inteligencia e experiencia', sidebarSectionOrder: 20 },
  { key: 'compliance', title: 'Compliance', menuLabel: 'Compliance', parent: 'Painel', order: 160, visible: true, roles: ['admin'], feature: 'compliance', icon: 'shield-check', sidebarSection: 'governanca', sidebarSectionLabel: 'Governanca e plataforma', sidebarSectionOrder: 30 },
  { key: 'platform-os', title: 'Platform OS', menuLabel: 'Platform', parent: 'Painel', order: 170, visible: true, roles: ['admin'], feature: 'platformOs', icon: 'server', sidebarSection: 'governanca', sidebarSectionLabel: 'Governanca e plataforma', sidebarSectionOrder: 30 },
  { key: 'ui-os', title: 'UI OS', menuLabel: 'UI Kit', parent: 'Painel', order: 180, visible: true, roles: ['admin'], feature: 'uiOs', icon: 'layout-panel-top', sidebarSection: 'governanca', sidebarSectionLabel: 'Governanca e plataforma', sidebarSectionOrder: 30 },
  { key: 'workspace-os', title: 'Workspace OS', menuLabel: 'Workspace', parent: 'Painel', order: 190, visible: true, roles: ['admin'], feature: 'workspaceOs', icon: 'panel-left-open', sidebarSection: 'governanca', sidebarSectionLabel: 'Governanca e plataforma', sidebarSectionOrder: 30 },
  { key: 'billing-os', title: 'Billing OS', menuLabel: 'Billing', parent: 'Painel', order: 200, visible: true, roles: ['admin'], feature: 'billingOs', icon: 'receipt', sidebarSection: 'governanca', sidebarSectionLabel: 'Governanca e plataforma', sidebarSectionOrder: 30 },
  { key: 'suporte', title: 'Suporte', menuLabel: 'Suporte', parent: 'Meu Caso', order: 530, visible: true, roles: ['cliente'], feature: 'suporte', icon: 'circle-help', sidebarSection: 'jornada', sidebarSectionLabel: 'Jornada e suporte', sidebarSectionOrder: 20 },
  { key: 'onboarding', title: 'Formulário', menuLabel: 'Formulário', parent: 'Meu Caso', order: 540, visible: true, roles: ['cliente'], feature: 'onboardingLegacy', icon: 'clipboard-list', sidebarSection: 'jornada', sidebarSectionLabel: 'Jornada e suporte', sidebarSectionOrder: 20 },
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
