import { estimateTenantCost, totalCost } from '../metrics/FinOpsMetrics.js';

export function buildTenantCostSnapshot(tenantId, usageSnapshot = {}) {
  const costs = estimateTenantCost(usageSnapshot);
  return {
    tenant_id: tenantId,
    costs,
    total: totalCost(costs),
    generated_at: new Date().toISOString(),
  };
}
