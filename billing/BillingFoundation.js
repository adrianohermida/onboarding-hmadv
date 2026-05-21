import { getTenantSubscription } from './subscriptions/SubscriptionService.js';
import { getTenantEntitlements } from './entitlements/EntitlementEngine.js';
import { snapshotUsage } from './usage/UsageTracker.js';
import { evaluateAllQuotas } from './quotas/QuotaEngine.js';
import { buildTenantCostSnapshot } from './costs/CostModel.js';
import { buildTenantEconomicsView } from './analytics/TenantEconomicsAnalytics.js';

export function buildTenantBillingSnapshot(tenantId = 'hmadv') {
  const subscription = getTenantSubscription(tenantId);
  const entitlements = getTenantEntitlements(subscription);
  const usage = snapshotUsage(tenantId);
  const quotas = evaluateAllQuotas(entitlements, usage);
  const cost = buildTenantCostSnapshot(tenantId, usage);

  return {
    tenant_id: tenantId,
    subscription,
    entitlements,
    usage,
    quotas,
    cost,
    economics: buildTenantEconomicsView({
      tenant_id: tenantId,
      usage,
      quotas,
      cost,
    }),
    generated_at: new Date().toISOString(),
  };
}
