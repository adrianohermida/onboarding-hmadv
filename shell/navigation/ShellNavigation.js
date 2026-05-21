import { moduleRegistry } from '../module-registry/ModuleRegistry.js';

export function buildShellNavigation({ isAdmin = false } = {}) {
  return moduleRegistry.getForRole(isAdmin ? 'admin' : 'cliente').map(module => ({
    key: module.key,
    title: module.title,
    menuLabel: module.menuLabel,
    route: module.route,
    icon: module.icon,
  }));
}

export default buildShellNavigation;
