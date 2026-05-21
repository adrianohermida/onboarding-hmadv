export function assertTenantMatch(expectedTenantId, targetTenantId, message = 'Tenant isolation violation') {
  if (!expectedTenantId || !targetTenantId || expectedTenantId !== targetTenantId) {
    throw new Error(message);
  }
  return true;
}
