class ProductCatalogFoundation {
  snapshot() {
    return {
      plans: ['free', 'starter', 'professional', 'enterprise', 'white_label_future'],
      addons: ['ai_credits', 'workflow_pack', 'onboarding_pack', 'analytics_pack'],
      generated_at: new Date().toISOString(),
    };
  }
}

export const productCatalogFoundation = new ProductCatalogFoundation();
