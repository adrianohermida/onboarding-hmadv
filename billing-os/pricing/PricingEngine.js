class PricingEngine {
  table() {
    return {
      currency: 'BRL',
      plans: {
        free: 0,
        starter: 19900,
        professional: 69900,
        enterprise: 199900,
      },
      feature_comparison_ready: true,
      tenant_pricing_ready: true,
      promotional_pricing_ready: true,
      generated_at: new Date().toISOString(),
    };
  }
}

export const pricingEngine = new PricingEngine();
