import { getPlan } from '../plans/PlanCatalog.js';

const subscriptions = new Map();

export function getTenantSubscription(tenantId = 'hmadv') {
  if (!subscriptions.has(tenantId)) {
    subscriptions.set(tenantId, {
      tenant_id: tenantId,
      plan_code: 'starter',
      status: 'active',
      cycle: 'monthly',
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }
  return subscriptions.get(tenantId);
}

export function updateTenantPlan(tenantId, planCode) {
  const current = getTenantSubscription(tenantId);
  const plan = getPlan(planCode);
  const next = {
    ...current,
    plan_code: plan.code,
    updated_at: new Date().toISOString(),
  };
  subscriptions.set(tenantId, next);
  return next;
}
