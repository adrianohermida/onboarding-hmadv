export function buildTenantEconomicsView({ tenant_id, usage = {}, quotas = {}, cost = {} }) {
  return {
    tenant_id,
    usage,
    quotas,
    cost,
    generated_at: new Date().toISOString(),
  };
}
