export function validateTenantAwarePayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, errors: ['payload must be an object'] };
  }
  if (!payload.tenant_id) {
    return { valid: false, errors: ['tenant_id is required'] };
  }
  return { valid: true, errors: [] };
}
