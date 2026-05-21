import { moduleRegistry } from '../module-registry/ModuleRegistry.js';

function getRouteKey(url) {
  try {
    const target = new URL(url, window.location.href);
    return (target.pathname.split('/').pop() || '').replace('.html', '');
  } catch (_) {
    return '';
  }
}

export class RouteGuards {
  canAccessRoute(url) {
    const key = getRouteKey(url);
    if (!key) return true;
    const module = moduleRegistry.get(key);
    if (!module) return true;
    return moduleRegistry.isAccessible(key);
  }
}

export const routeGuards = new RouteGuards();
export default routeGuards;
