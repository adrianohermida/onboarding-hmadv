import { store } from '../state/ShellStore.js';

export class PermissionService {
  hasRole(allowedRoles = []) {
    if (!Array.isArray(allowedRoles) || !allowedRoles.length) return true;
    const { isAdmin } = store.get('auth');
    const role = isAdmin ? 'admin' : 'cliente';
    return allowedRoles.includes(role);
  }

  hasPermissions(requiredPermissions = []) {
    if (!Array.isArray(requiredPermissions) || !requiredPermissions.length) return true;
    const { isAdmin } = store.get('auth');
    if (isAdmin) return true;
    return requiredPermissions.every(permission => permission === 'client');
  }

  canAccess(manifest = {}) {
    return this.hasRole(manifest.roles) && this.hasPermissions(manifest.permissions);
  }
}

export const permissionService = new PermissionService();
export default permissionService;
