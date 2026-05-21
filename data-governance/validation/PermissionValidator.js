export function validatePermission(requiredPermission, availablePermissions = []) {
  const allowed = Array.isArray(availablePermissions) && availablePermissions.includes(requiredPermission);
  return {
    valid: allowed,
    errors: allowed ? [] : [`missing permission: ${requiredPermission}`],
  };
}
