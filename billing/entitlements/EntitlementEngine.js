import { getPlan } from '../plans/PlanCatalog.js';

export function getTenantEntitlements(subscription = {}) {
  const plan = getPlan(subscription.plan_code || 'starter');
  return {
    tenant_id: subscription.tenant_id || 'hmadv',
    plan_code: plan.code,
    features: { ...plan.features },
    limits: { ...plan.limits },
  };
}

export function isFeatureEnabled(entitlements, featureKey) {
  return !!entitlements?.features?.[featureKey];
}
