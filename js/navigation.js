export const FEATURE_FLAGS = {
  dashboard: true,
  meuCaso: true,
  meusDocumentos: true,
  minhasDividas: true,
  custas: true,
  contratos: true,
  meuPlano: true,
  planoPagamento: true,
  mensagensCliente: true,
  ajuda: true,
  painel: true,
  clientes: true,
  partes: true,
  onboardingV2: true,
  financialDashboard: true,
  documentos: true,
  dividas: true,
  planos: true,
  processos: true,
  movimentacoes: true,
  prazos: true,
  custasProcessuais: true,
  financeiroProcessual: true,
  tpu: true,
  orgaosJudiciarios: true,
  serventias: true,
  relacoesProcessuais: true,
  audiencias: true,
  publicacoes: true,
  tarefas: true,
  agenda: true,
  mensagens: true,
  financeiro: true,
  suporte: true,
  onboardingLegacy: true,
  analytics: true,
  aiCopilot: true,
  gestaoPortal: true,
  clientExperience: true,
  financialIntelligence: true,
  legalOperations: true,
  compliance: true,
  platformOs: true,
  uiOs: true,
  workspaceOs: true,
  billingOs: true,
};

// ─────────────────────────────────────────────────────────────────────────────
// PORTAL MODULES
//
// sidebarSection / sidebarSectionLabel / sidebarSectionOrder → cliente view
// adminSidebarSection / adminSidebarSectionLabel / adminSidebarSectionOrder → admin view
// visible: false → hidden from sidebar (still routable)
// ─────────────────────────────────────────────────────────────────────────────

export const PORTAL_MODULES = [

  // ── Cliente — 4 sidebar hubs ─────────────────────────────────────────────

  { key: 'meu-caso',        title: 'Meu Caso',            menuLabel: 'Meu Caso',       parent: null,      order: 10,  visible: true,  roles: ['cliente'],  feature: 'meuCaso',          icon: 'heart-handshake', sidebarSection: 'portal', sidebarSectionLabel: '', sidebarSectionOrder: 10 },
  { key: 'financeiro',      title: 'Financeiro',          menuLabel: 'Financeiro',     parent: 'Meu Caso', order: 20, visible: true,  roles: ['cliente'],  feature: 'financeiro',       icon: 'wallet',          sidebarSection: 'portal', sidebarSectionLabel: '', sidebarSectionOrder: 10 },
  { key: 'meus-documentos', title: 'Documentos',          menuLabel: 'Documentos',     parent: 'Meu Caso', order: 30, visible: true,  roles: ['cliente'],  feature: 'meusDocumentos',   icon: 'file-text',       sidebarSection: 'portal', sidebarSectionLabel: '', sidebarSectionOrder: 10 },
  { key: 'ajuda',           title: 'Atendimento',         menuLabel: 'Atendimento',    parent: 'Meu Caso', order: 50, visible: true,  roles: ['cliente'],  feature: 'ajuda',            icon: 'headphones',      sidebarSection: 'portal', sidebarSectionLabel: '', sidebarSectionOrder: 10 },

  // ── Cliente — sub-pages (routable but not in sidebar) ────────────────────

  { key: 'custas',          title: 'Custas',              menuLabel: 'Custas',         parent: 'Financeiro', order: 210, visible: false, roles: ['cliente'],        feature: 'custas',           icon: 'receipt' },
  { key: 'contratos',       title: 'Contratos',           menuLabel: 'Contratos',      parent: 'Financeiro', order: 220, visible: false, roles: ['cliente'],        feature: 'contratos',        icon: 'file-signature' },
  { key: 'meu-plano',       title: 'Meu Plano',           menuLabel: 'Meu Plano',      parent: 'Financeiro', order: 230, visible: false, roles: ['cliente'],        feature: 'meuPlano',         icon: 'map' },
  { key: 'plano-pagamento', title: 'Plano de Pagamento',  menuLabel: 'Plano',          parent: 'Financeiro', order: 240, visible: false, roles: ['cliente'],        feature: 'planoPagamento',   icon: 'list-checks' },
  { key: 'minhas-dividas',  title: 'Minhas Dívidas',      menuLabel: 'Dívidas',        parent: 'Financeiro', order: 250, visible: false, roles: ['cliente'],        feature: 'minhasDividas',    icon: 'credit-card' },
  { key: 'dashboard',       title: 'Dashboard',           menuLabel: 'Início',         parent: null,         order: 500, visible: false, roles: ['cliente'],        feature: 'dashboard',        icon: 'layout-dashboard' },
  { key: 'suporte',         title: 'Suporte',             menuLabel: 'Suporte',        parent: 'Meu Caso',   order: 510, adminOrder: 150, visible: true,  roles: ['admin'], feature: 'suporte',        icon: 'circle-help',    adminSidebarSection: 'relacionamento', adminSidebarSectionLabel: 'Relacionamento', adminSidebarSectionOrder: 40 },
  { key: 'onboarding',      title: 'Formulário',          menuLabel: 'Formulário',     parent: 'Meu Caso',   order: 520, visible: false, roles: ['cliente', 'admin'], feature: 'onboardingLegacy', icon: 'clipboard-list' },
  { key: 'onboarding-v2',   title: 'Jornada CNJ',         menuLabel: 'Jornada Cliente', parent: 'Meu Caso',  order: 530, adminOrder: 145, visible: true, roles: ['admin'], feature: 'onboardingV2', icon: 'route', adminSidebarSection: 'relacionamento', adminSidebarSectionLabel: 'Relacionamento', adminSidebarSectionOrder: 40 },
  { key: 'financial-dashboard', title: 'Diagnóstico Financeiro', menuLabel: 'Diagnóstico', parent: 'Meu Caso', order: 540, visible: false, roles: ['cliente', 'admin'], feature: 'financialDashboard', icon: 'chart-column' },

  // ── Admin — Painel ────────────────────────────────────────────────────────

  { key: 'painel',          title: 'Painel do Advogado',  menuLabel: 'Painel',         parent: null,   order: 10,  visible: true, roles: ['admin'], feature: 'painel',   icon: 'briefcase',        adminSidebarSection: 'painel',       adminSidebarSectionLabel: 'Painel',       adminSidebarSectionOrder: 10 },

  // ── Admin — Operações ─────────────────────────────────────────────────────

  { key: 'clientes',        title: 'Clientes',            menuLabel: 'Clientes',       parent: 'Painel', order: 20,  visible: true, roles: ['admin'], feature: 'clientes',   icon: 'users',            adminSidebarSection: 'operacoes',    adminSidebarSectionLabel: 'Operações',    adminSidebarSectionOrder: 20 },
  { key: 'processos',       title: 'Processos',           menuLabel: 'Processos',      parent: 'Painel', order: 30,  visible: true, roles: ['admin'], feature: 'processos',  icon: 'scale',            adminSidebarSection: 'operacoes',    adminSidebarSectionLabel: 'Operações',    adminSidebarSectionOrder: 20 },
  { key: 'publicacoes',     title: 'Publicações',         menuLabel: 'Publicações',    parent: 'Painel', order: 40,  visible: true, roles: ['admin'], feature: 'publicacoes', icon: 'newspaper',       adminSidebarSection: 'operacoes',    adminSidebarSectionLabel: 'Operações',    adminSidebarSectionOrder: 20 },
  { key: 'prazos',          title: 'Prazos',              menuLabel: 'Prazos',         parent: 'Painel', order: 50,  visible: true, roles: ['admin'], feature: 'prazos',    icon: 'alarm-clock-check', adminSidebarSection: 'operacoes',    adminSidebarSectionLabel: 'Operações',    adminSidebarSectionOrder: 20 },
  { key: 'tarefas',         title: 'Tarefas',             menuLabel: 'Tarefas',        parent: 'Painel', order: 60,  visible: true, roles: ['admin'], feature: 'tarefas',   icon: 'check-square',     adminSidebarSection: 'operacoes',    adminSidebarSectionLabel: 'Operações',    adminSidebarSectionOrder: 20 },
  { key: 'agenda',          title: 'Agenda',              menuLabel: 'Agenda',         parent: 'Painel', order: 70,  visible: true, roles: ['admin'], feature: 'agenda',    icon: 'calendar-days',    adminSidebarSection: 'operacoes',    adminSidebarSectionLabel: 'Operações',    adminSidebarSectionOrder: 20 },
  { key: 'audiencias',      title: 'Audiências',          menuLabel: 'Audiências',     parent: 'Painel', order: 80,  visible: true, roles: ['admin'], feature: 'audiencias', icon: 'gavel',            adminSidebarSection: 'operacoes',    adminSidebarSectionLabel: 'Operações',    adminSidebarSectionOrder: 20 },

  // ── Admin — Financeiro ────────────────────────────────────────────────────

  { key: 'financeiro',              title: 'Honorários',          menuLabel: 'Honorários',     parent: 'Painel', order: 110, visible: true, roles: ['admin'], feature: 'financeiro',          icon: 'wallet',        adminSidebarSection: 'financeiro-adm', adminSidebarSectionLabel: 'Financeiro', adminSidebarSectionOrder: 30 },
  { key: 'custas-processuais',      title: 'Custas',              menuLabel: 'Custas',         parent: 'Painel', order: 120, visible: true, roles: ['admin'], feature: 'custasProcessuais',    icon: 'receipt',       adminSidebarSection: 'financeiro-adm', adminSidebarSectionLabel: 'Financeiro', adminSidebarSectionOrder: 30 },
  { key: 'financeiro-processual',   title: 'Financeiro Processual', menuLabel: 'Cobranças',    parent: 'Painel', order: 130, visible: false, roles: ['admin'], feature: 'financeiroProcessual', icon: 'wallet-cards' },

  // ── Admin — Relacionamento ─────────────────────────────────────────────────

  { key: 'mensagens', title: 'Mensagens', menuLabel: 'Mensagens', parent: 'Painel', order: 40, adminOrder: 140, visible: true, roles: ['admin'], feature: 'mensagensCliente', icon: 'message-square', adminSidebarSection: 'relacionamento', adminSidebarSectionLabel: 'Relacionamento', adminSidebarSectionOrder: 40 },

  // ── Admin — Gestão ────────────────────────────────────────────────────────

  { key: 'analytics',        title: 'Indicadores',         menuLabel: 'Indicadores',    parent: 'Painel', order: 200, visible: true, roles: ['admin'], feature: 'analytics',          icon: 'chart-scatter',   adminSidebarSection: 'gestao', adminSidebarSectionLabel: 'Gestão', adminSidebarSectionOrder: 50 },
  { key: 'ai-copilot',       title: 'Assistente Jurídico', menuLabel: 'Assistente IA',  parent: 'Painel', order: 210, visible: true, roles: ['admin'], feature: 'aiCopilot',          icon: 'sparkles',        adminSidebarSection: 'gestao', adminSidebarSectionLabel: 'Gestão', adminSidebarSectionOrder: 50 },
  { key: 'gestao',           title: 'Gestão do Portal',    menuLabel: 'Gestão',         parent: 'Painel', order: 220, visible: true, roles: ['admin'], feature: 'gestaoPortal',        icon: 'settings-2',      adminSidebarSection: 'gestao', adminSidebarSectionLabel: 'Gestão', adminSidebarSectionOrder: 50 },

  // ── Admin — sub-pages (routable, not in sidebar) ──────────────────────────

  { key: 'partes',              title: 'Partes',                menuLabel: 'Partes',              parent: 'Painel', order: 300, adminOrder: 160, visible: true,  roles: ['admin'], feature: 'partes',              icon: 'contact-round', adminSidebarSection: 'cadastros', adminSidebarSectionLabel: 'Cadastros', adminSidebarSectionOrder: 45 },
  { key: 'documentos',          title: 'Documentos',            menuLabel: 'Documentos',          parent: 'Painel', order: 310, visible: false, roles: ['admin'], feature: 'documentos',          icon: 'file-text' },
  { key: 'dividas',             title: 'Dívidas',               menuLabel: 'Dívidas',             parent: 'Painel', order: 320, visible: false, roles: ['admin'], feature: 'dividas',             icon: 'credit-card' },
  { key: 'planos',              title: 'Planos',                menuLabel: 'Planos',              parent: 'Painel', order: 330, visible: false, roles: ['admin'], feature: 'planos',              icon: 'landmark' },
  { key: 'movimentacoes',       title: 'Movimentações',         menuLabel: 'Movimentações',       parent: 'Painel', order: 340, visible: false, roles: ['admin'], feature: 'movimentacoes',       icon: 'history' },
  { key: 'relacoes-processuais',title: 'Relações Processuais',  menuLabel: 'Relações Processuais',parent: 'Painel', order: 350, visible: false, roles: ['admin'], feature: 'relacoesProcessuais', icon: 'git-merge' },
  { key: 'tpu',                 title: 'TPU',                   menuLabel: 'TPU',                 parent: 'Painel', order: 360, visible: false, roles: ['admin'], feature: 'tpu',                 icon: 'network' },
  { key: 'orgaos-judiciarios',  title: 'Órgãos Judiciários',    menuLabel: 'Órgãos Judiciários',  parent: 'Painel', order: 370, visible: false, roles: ['admin'], feature: 'orgaosJudiciarios',   icon: 'building-2' },
  { key: 'serventias',          title: 'Serventias',            menuLabel: 'Serventias',          parent: 'Painel', order: 380, visible: false, roles: ['admin'], feature: 'serventias',          icon: 'land-plot' },
  { key: 'experiencia-cliente', title: 'Experiência do Cliente',menuLabel: 'Experiência',         parent: 'Painel', order: 390, visible: false, roles: ['admin'], feature: 'clientExperience',    icon: 'heart-handshake' },
  { key: 'financeiro-inteligencia', title: 'Inteligência Financeira', menuLabel: 'Análise financeira', parent: 'Painel', order: 400, visible: false, roles: ['admin'], feature: 'financialIntelligence', icon: 'brain-circuit' },
  { key: 'operacoes-juridicas', title: 'Operação Jurídica',     menuLabel: 'Operação',            parent: 'Painel', order: 410, visible: false, roles: ['admin'], feature: 'legalOperations',     icon: 'scale' },
  { key: 'compliance',          title: 'Governança',            menuLabel: 'Governança',          parent: 'Painel', order: 420, visible: false, roles: ['admin'], feature: 'compliance',          icon: 'shield-check' },
  { key: 'platform-os',         title: 'Plataforma',            menuLabel: 'Plataforma',          parent: 'Painel', order: 430, visible: false, roles: ['admin'], feature: 'platformOs',          icon: 'server' },
  { key: 'ui-os',               title: 'Design System',         menuLabel: 'Design System',       parent: 'Painel', order: 440, visible: false, roles: ['admin'], feature: 'uiOs',                icon: 'layout-panel-top' },
  { key: 'workspace-os',        title: 'Workspace Técnico',     menuLabel: 'Workspace Técnico',   parent: 'Painel', order: 450, visible: false, roles: ['admin'], feature: 'workspaceOs',         icon: 'panel-left-open' },
  { key: 'billing-os',          title: 'Faturamento',           menuLabel: 'Faturamento',         parent: 'Painel', order: 460, visible: false, roles: ['admin'], feature: 'billingOs',           icon: 'receipt' },

  // ── Public ────────────────────────────────────────────────────────────────
  { key: 'login',         title: 'Acesso',       menuLabel: 'Acesso',       parent: null, order: 999, visible: false, roles: ['public'], icon: 'log-in' },
  { key: 'auth-callback', title: 'Autenticação', menuLabel: 'Autenticação', parent: null, order: 1000, visible: false, roles: ['public'], icon: 'shield-check' },
];

// ─────────────────────────────────────────────────────────────────────────────

function readTenantFeatureOverrides() {
  if (typeof window === 'undefined') return null;
  if (window.__portalTenantConfig?.featureFlags && typeof window.__portalTenantConfig.featureFlags === 'object') {
    return window.__portalTenantConfig.featureFlags;
  }
  try {
    const raw = sessionStorage.getItem('portal:tenant-config');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.featureFlags && typeof parsed.featureFlags === 'object' ? parsed.featureFlags : null;
  } catch (_) {
    return null;
  }
}

export function resolveFeatureFlags(featureFlags = null) {
  return { ...FEATURE_FLAGS, ...(readTenantFeatureOverrides() || {}), ...(featureFlags || {}) };
}

export function getModule(key) {
  return PORTAL_MODULES.find(m => m.key === key) || null;
}

export function getRoutes() {
  return Object.fromEntries(
    PORTAL_MODULES.map(m => [m.key, { title: m.title, parent: m.parent }]),
  );
}

export function getSidebarModules({ isAdmin = false, featureFlags = null } = {}) {
  const role = isAdmin ? 'admin' : 'cliente';
  const resolvedFlags = resolveFeatureFlags(featureFlags);
  return PORTAL_MODULES
    .filter(m => m.visible)
    .filter(m => m.roles.includes(role))
    .filter(m => !m.feature || resolvedFlags[m.feature] === true)
    .sort((a, b) => {
      const orderKey = isAdmin ? 'adminOrder' : 'clientOrder';
      return (a[orderKey] ?? a.order) - (b[orderKey] ?? b.order);
    });
}
