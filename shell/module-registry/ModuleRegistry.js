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
import { PORTAL_MODULES } from '../../js/navigation.js';
import { store }          from '../state/ShellStore.js';
import { tenantProvider } from '../tenant/TenantProvider.js';
import { moduleLoader }   from '../module-loader/ModuleLoader.js';

export class ModuleRegistry {
  constructor() {
    this._modules = new Map();
    this._loaded  = false;
  }

  // ── Init ─────────────────────────────────────────────────────────────────
  init() {
    // Seed from navigation.js PORTAL_MODULES (backwards compat)
    PORTAL_MODULES.forEach(m => this.register(m));
    this.refreshFromManifests();
    this._loaded = true;
    return this;
  }

  async refreshFromManifests() {
    try {
      const manifests = await moduleLoader.loadAllManifests();
      manifests.forEach(manifest => this.register(manifest));
    } catch (_) {}
    return this;
  }

  // ── Register ──────────────────────────────────────────────────────────────
  register(manifest) {
    const key = manifest?.key || manifest?.module;
    if (!key) throw new Error('[ModuleRegistry] manifest.key required');

    const normalizedRoles = (manifest.roles || manifest.permissions || ['cliente', 'admin'])
      .map(role => role === 'client' ? 'cliente' : role);

    this._modules.set(key, {
      key,
      title:      manifest.title       || key,
      menuLabel:  manifest.menuLabel   || manifest.title || key,
      route:      manifest.route       || `/pages/${key}.html`,
      icon:       manifest.icon        || 'file',
      roles:      normalizedRoles,
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

  getByRoute(routeOrUrl = '') {
    try {
      const url = new URL(routeOrUrl, window.location.href);
      const path = url.pathname;
      return this.getAll().find(module => module.route === path || module.route === url.pathname) || null;
    } catch (_) {
      return this.getAll().find(module => module.route === routeOrUrl) || null;
    }
  }

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

  async preload(key) {
    const module = this.get(key);
    if (!module) return false;
    return moduleLoader.preload(module);
  }
}

// Singleton
export const moduleRegistry = new ModuleRegistry();
export default moduleRegistry;
