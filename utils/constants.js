export const APP_NAME    = 'Portal do Superendividado';
export const APP_TAGLINE = 'Assessoria Jurídica ao Consumidor';
export const APP_VERSION = '1.0.0';

export const ROUTES = {
  ROOT:       '/',
  LOGIN:      '/pages/login.html',
  DASHBOARD:  '/pages/dashboard.html',
  ONBOARDING: '/pages/onboarding.html',
  DOCUMENTOS: '/pages/documentos.html',
  DIVIDAS:    '/pages/dividas.html',
};

export const NAV_LINKS = [
  { href: 'dashboard.html',  label: 'Dashboard',   icon: 'home'   },
  { href: 'onboarding.html', label: 'Onboarding',  icon: 'user'   },
  { href: 'documentos.html', label: 'Documentos',  icon: 'file'   },
  { href: 'dividas.html',    label: 'Dívidas',     icon: 'list'   },
];

export const CASE_STAGES = [
  { key: 'intake',    label: 'Cadastro'      },
  { key: 'docs',      label: 'Documentos'    },
  { key: 'analysis',  label: 'Análise'       },
  { key: 'proposal',  label: 'Proposta'      },
  { key: 'concluded', label: 'Concluído'     },
];

export const DOC_STATUS = {
  PENDING:   { label: 'Pendente',    cls: 'chip-warn' },
  UPLOADED:  { label: 'Enviado',     cls: 'chip-blue' },
  APPROVED:  { label: 'Aprovado',    cls: 'chip-ok'   },
  REJECTED:  { label: 'Rejeitado',   cls: 'chip-red'  },
};

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'portal_auth_token',
  USER:       'portal_user',
  CASE:       'portal_case',
};
