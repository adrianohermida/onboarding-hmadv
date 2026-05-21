class DiscountEngine {
  snapshot() {
    return {
      coupons_ready: true,
      discounts_ready: true,
      promotional_offers_ready: true,
      enterprise_pricing_ready: true,
      generated_at: new Date().toISOString(),
    };
  }
}

export const discountEngine = new DiscountEngine();
