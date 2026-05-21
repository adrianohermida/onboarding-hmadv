const ROLE_ORDER = ['client', 'lawyer', 'operator', 'admin', 'superadmin'];

export function hasRole(requiredRole, currentRole = 'client') {
  return ROLE_ORDER.indexOf(currentRole) >= ROLE_ORDER.indexOf(requiredRole);
}

export function assertRole(requiredRole, currentRole, message = 'Permission denied') {
  if (!hasRole(requiredRole, currentRole)) {
    throw new Error(message);
  }
  return true;
}
