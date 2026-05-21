/**
 * TenantProvider — tenant context, branding, feature flags.
 *
 * Currently single-tenant (hmadv) but architected for multi-tenancy.
 * Future: fetch tenant config from DB by subdomain/workspace.
 */
import { store } from '../state/ShellStore.js';
import { bus }   from '../../modules/events/EventBus.js';

// Default tenant config (Hermida Maia Advocacia)
const DEFAULT_TENANT = {
  id:   'hmadv',
  name: 'Hermida Maia Advocacia',
  slug: 'hmadv',
  branding: {
    primary:    '#1A3A5C',
    accent:     '#F5A623',
    logoMark:   null,          // uses SVG fallback
    fontSerif:  "'Libre Baskerville', Georgia, serif",
    fontSans:   "'DM Sans', system-ui, sans-serif",
  },
  featureFlags: {
    dashboard:          true,
    onboardingV2:       true,
    financialDashboard: true,
    documentos:         true,
    dividas:            true,
    suporte:            true,
    onboardingLegacy:   true,
    analytics:          false,
    autentique:         false,  // enable when API key set
    freshdesk:          true,
  },
  limits: {
    maxDocumentSizeMB: 10,
    maxDocumentsPerCase: 50,
  },
};

export class TenantProvider {
  constructor() {
    this._config = DEFAULT_TENANT;
  }

  // ── Init ────────────────────────────────────────────────────────────────────
  async init() {
    // Future: resolve tenant from workspace_id in user session
    // const workspace = await resolveWorkspace();
    // this._config = { ...DEFAULT_TENANT, ...workspace };

    store._set('tenant', {
      id:       this._config.id,
      name:     this._config.name,
      branding: this._config.branding,
    });

    bus.emit('tenant.ready', { tenant: this._config });
    bus.emit('tenant.changed', { tenant: this._config });
    return this._config;
  }

  // ── Accessors ────────────────────────────────────────────────────────────────
  getConfig()            { return this._config; }
  getBranding()          { return this._config.branding; }
  getFeatureFlags()      { return this._config.featureFlags; }
  isFeatureEnabled(key)  { return this._config.featureFlags[key] === true; }
  getLimits()            { return this._config.limits; }
  getTenantId()          { return this._config.id; }
}

// Singleton
export const tenantProvider = new TenantProvider();
export default tenantProvider;
