export function assertDocumentGovernance(payload = {}) {
  if (!payload.tenant_id) throw new Error('document governance violation: tenant awareness is required');
  if (!payload.owner_id) throw new Error('document governance violation: ownership is required');
  if (!payload.type) throw new Error('document governance violation: taxonomy type is required');
  if (!payload.category) throw new Error('document governance violation: taxonomy category is required');
  if (!payload.lifecycle_state) throw new Error('document governance violation: lifecycle state is required');
  if (!payload.retention_policy) throw new Error('document governance violation: retention policy is required');
  return true;
}
