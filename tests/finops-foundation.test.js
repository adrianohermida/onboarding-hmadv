import { describe, expect, it } from 'vitest';
import { getPlan } from '../billing/plans/PlanCatalog.js';
import { getTenantSubscription } from '../billing/subscriptions/SubscriptionService.js';
import { getTenantEntitlements } from '../billing/entitlements/EntitlementEngine.js';
import { recordUsage, snapshotUsage } from '../billing/usage/UsageTracker.js';
import { evaluateAllQuotas } from '../billing/quotas/QuotaEngine.js';
import { buildTenantCostSnapshot } from '../billing/costs/CostModel.js';
import { buildTenantBillingSnapshot } from '../billing/BillingFoundation.js';

describe('finops foundation', () => {
  it('resolves plan, entitlements and quota evaluation', () => {
    const plan = getPlan('professional');
    const subscription = getTenantSubscription('hmadv');
    const entitlements = getTenantEntitlements({ ...subscription, plan_code: 'professional' });

    expect(plan.code).toBe('professional');
    expect(entitlements.limits.max_users).toBeGreaterThan(0);
    expect(entitlements.features.analytics_advanced).toBe(true);

    recordUsage('hmadv', 'max_users', 3);
    const usage = snapshotUsage('hmadv');
    const quotas = evaluateAllQuotas(entitlements, usage);

    expect(quotas.max_users.limit).toBe(entitlements.limits.max_users);
    expect(quotas.max_users.used).toBe(3);
  });

  it('builds cost and billing snapshot structures', () => {
    recordUsage('hmadv', 'storage_mb', 500);
    const usage = snapshotUsage('hmadv');
    const cost = buildTenantCostSnapshot('hmadv', usage);
    const snapshot = buildTenantBillingSnapshot('hmadv');

    expect(cost.tenant_id).toBe('hmadv');
    expect(cost.total).toBeGreaterThanOrEqual(0);
    expect(snapshot.subscription).toBeTruthy();
    expect(snapshot.entitlements).toBeTruthy();
    expect(snapshot.quotas).toBeTruthy();
  });
});
