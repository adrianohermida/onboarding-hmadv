export function assertFinancialGovernance(payload = {}) {
  if (!payload.tenant_id) throw new Error('financial governance violation: tenant awareness is required');
  if (!payload.actor_id) throw new Error('financial governance violation: actor is required');
  if (!payload.timeline_event) throw new Error('financial governance violation: timeline event is required');
  if (!payload.analytics_ref) throw new Error('financial governance violation: analytics linkage is required');
  return true;
}
