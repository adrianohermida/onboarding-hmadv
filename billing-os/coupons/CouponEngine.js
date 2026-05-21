class CouponEngine {
  snapshot() {
    return {
      enabled: true,
      coupons: [],
      generated_at: new Date().toISOString(),
    };
  }
}

export const couponEngine = new CouponEngine();
