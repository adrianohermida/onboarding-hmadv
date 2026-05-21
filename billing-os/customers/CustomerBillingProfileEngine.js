class CustomerBillingProfileEngine {
  build(payload = {}) {
    return {
      tenant_id: payload.tenant_id || 'hmadv',
      customer_id: payload.customer_id || `cus_${payload.tenant_id || 'hmadv'}`,
      billing_email: payload.billing_email || 'billing@hermidamaia.adv.br',
      payment_methods: Array.isArray(payload.payment_methods) ? payload.payment_methods : ['card'],
      subscription: payload.subscription || null,
      invoices: Array.isArray(payload.invoices) ? payload.invoices : [],
      usage: payload.usage || {},
      entitlements: payload.entitlements || {},
      generated_at: new Date().toISOString(),
    };
  }
}

export const customerBillingProfileEngine = new CustomerBillingProfileEngine();
