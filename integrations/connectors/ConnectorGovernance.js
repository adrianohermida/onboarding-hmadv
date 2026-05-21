export function assertConnectorAccessPolicy(context = {}) {
  if (context.accesses_shell) {
    throw new Error('connector governance violation: connector cannot access shell');
  }
  if (context.accesses_private_store) {
    throw new Error('connector governance violation: connector cannot access private stores');
  }
  if (context.accesses_arbitrary_tables) {
    throw new Error('connector governance violation: connector cannot access arbitrary tables');
  }
  if (!context.tenant_id) {
    throw new Error('connector governance violation: tenant awareness is required');
  }
  return true;
}
