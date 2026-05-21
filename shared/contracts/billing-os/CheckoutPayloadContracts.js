export function normalizeBillingCheckoutPayload(payload = {}) {
  return {
    checkout_id: payload.checkout_id || null,
    tenant_id: payload.tenant_id || 'hmadv',
    plan_code: payload.plan_code || 'starter',
    mode: payload.mode || 'upgrade',
    status: payload.status || 'pending',
    provider: payload.provider || 'stripe',
  };
}
