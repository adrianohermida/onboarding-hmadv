export function normalizeBillingSubscriptionPayload(payload = {}) {
  return {
    subscription_id: payload.subscription_id || null,
    tenant_id: payload.tenant_id || 'hmadv',
    plan_code: payload.plan_code || 'starter',
    status: payload.status || 'active',
    trial_active: payload.trial_active === true,
    renewal_at: payload.renewal_at || null,
    canceled_at: payload.canceled_at || null,
  };
}
