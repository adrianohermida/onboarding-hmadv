/**
 * ModuleRegistry — central registry of all pluggable modules.
 *
 * Modules register via manifest. The registry controls:
 * - Discovery
 * - Permission checks
 * - Nav generation
 * - Feature flag gating
 * - Lazy loading
 */
import { PORTAL_MODULES, FEATURE_FLAGS } from '../../js/navigation.js';
import { store }          from '../state/ShellStore.js';
import { tenantProvider } from '../tenant/TenantProvider.js';

export class ModuleRegistry {
  constructor() {
    this._modules = new Map();
    this._loaded  = false;
  }

  // ── Init ─────────────────────────────────────────────────────────────────
  init() {
    // Seed from navigation.js PORTAL_MODULES (backwards compat)
    PORTAL_MODULES.forEach(m => this.register(m));
    this._loaded = true;
    return this;
  }

  // ── Register ──────────────────────────────────────────────────────────────
  register(manifest) {
    if (!manifest?.key) throw new Error('[ModuleRegistry] manifest.key required');
    this._modules.set(manifest.key, {
      key:        manifest.key,
      title:      manifest.title       || manifest.key,
      menuLabel:  manifest.menuLabel   || manifest.title,
      route:      manifest.route       || `/pages/${manifest.key}.html`,
      icon:       manifest.icon        || 'file',
      roles:      manifest.roles       || ['cliente', 'admin'],
      feature:    manifest.feature     || null,
      visible:    manifest.visible     !== false,
      lazy:       manifest.lazy        !== false,
      order:      manifest.order       ?? 99,
      parent:     manifest.parent      || null,
      permissions:manifest.permissions || [],
    });
  }

  // ── Query ──────────────────────────────────────────────────────────────────
  getAll() { return [...this._modules.values()]; }

  get(key) { return this._modules.get(key) || null; }

  getForRole(role = 'cliente') {
    const flags  = tenantProvider.getFeatureFlags();
    return this.getAll()
      .filter(m => m.visible)
      .filter(m => m.roles.includes(role))
      .filter(m => !m.feature || flags[m.feature] === true)
      .sort((a, b) => a.order - b.order);
  }

  getNavItems() {
    const { isAdmin } = store.get('auth');
    return this.getForRole(isAdmin ? 'admin' : 'cliente');
  }

  isAccessible(key) {
    const mod = this.get(key);
    if (!mod) return false;
    const { isAdmin } = store.get('auth');
    const role = isAdmin ? 'admin' : 'cliente';
    if (!mod.roles.includes(role)) return false;
    const flags = tenantProvider.getFeatureFlags();
    if (mod.feature && !flags[mod.feature]) return false;
    return true;
  }
}

// Singleton
export const moduleRegistry = new ModuleRegistry();
export default moduleRegistry;
