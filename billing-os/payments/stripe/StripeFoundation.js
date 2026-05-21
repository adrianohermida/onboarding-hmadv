class StripeFoundation {
  createCheckoutSession(payload = {}) {
    return {
      provider: 'stripe',
      session_id: payload.session_id || `cs_${Date.now()}`,
      tenant_id: payload.tenant_id || 'hmadv',
      plan_code: payload.plan_code || 'starter',
      mode: payload.mode || 'subscription',
      status: payload.status || 'created',
      generated_at: new Date().toISOString(),
    };
  }

  createPaymentIntent(payload = {}) {
    return {
      provider: 'stripe',
      payment_intent_id: payload.payment_intent_id || `pi_${Date.now()}`,
      tenant_id: payload.tenant_id || 'hmadv',
      amount_cents: Number(payload.amount_cents) || 0,
      currency: payload.currency || 'BRL',
      status: payload.status || 'requires_payment_method',
      generated_at: new Date().toISOString(),
    };
  }
}

export const stripeFoundation = new StripeFoundation();
