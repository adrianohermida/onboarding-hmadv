import { obs } from '../observability/Observability.js';

const DEFAULT_MANIFEST_URLS = [
  '/modules/dashboard/module.manifest.json',
  '/modules/journey/module.manifest.json',
  '/modules/financial/module.manifest.json',
  '/modules/documents/module.manifest.json',
  '/modules/dividas/module.manifest.json',
  '/modules/ui/module.manifest.json',
];

function normalizeManifest(raw = {}) {
  const moduleKey = raw.module || raw.key;
  if (!moduleKey) return null;

  const normalizedRoles = (Array.isArray(raw.roles) && raw.roles.length
    ? raw.roles
    : (Array.isArray(raw.permissions) ? raw.permissions : ['cliente', 'admin']))
    .map(role => {
      if (role === 'client') return 'cliente';
      if (role === 'lawyer') return 'advogado';
      return role;
    });

  return {
    key: moduleKey,
    module: moduleKey,
    title: raw.title || moduleKey,
    menuLabel: raw.menuLabel || raw.title || moduleKey,
    route: raw.route || `/pages/${moduleKey}.html`,
    icon: raw.icon || 'file',
    roles: normalizedRoles,
    permissions: raw.permissions || [],
    feature: raw.feature || null,
    lazy: raw.lazy !== false,
    preload: raw.preload !== false,
    visible: raw.visible !== false,
    order: Number.isFinite(raw.order) ? raw.order : 99,
    parent: raw.parent || null,
  };
}

export class ModuleLoader {
  constructor() {
    this._cache = new Map();
    this._manifestUrls = DEFAULT_MANIFEST_URLS;
  }

  configureManifestUrls(urls = []) {
    if (Array.isArray(urls) && urls.length) {
      this._manifestUrls = urls;
    }
    return this;
  }

  async loadAllManifests() {
    const results = await Promise.allSettled(this._manifestUrls.map(url => this.loadManifest(url)));
    return results
      .filter(result => result.status === 'fulfilled' && result.value)
      .map(result => result.value);
  }

  async loadManifest(url) {
    if (this._cache.has(url)) return this._cache.get(url);

    const startedAt = performance.now();
    try {
      const response = await fetch(url, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
      });

      if (!response.ok) return null;
      const raw = await response.json();
      const manifest = normalizeManifest(raw);
      if (!manifest) return null;

      this._cache.set(url, manifest);
      obs.moduleLoad(manifest.key, Math.round(performance.now() - startedAt));
      return manifest;
    } catch (_) {
      return null;
    }
  }

  async preload(moduleConfig = {}) {
    if (!moduleConfig.lazy) return true;
    if (typeof moduleConfig.loader === 'function') {
      try {
        await moduleConfig.loader();
        return true;
      } catch (_) {
        return false;
      }
    }
    return true;
  }
}

export const moduleLoader = new ModuleLoader();
export default moduleLoader;
