class MeteringEngine {
  snapshot(payload = {}) {
    return {
      usage_billing_ready: true,
      metered_events: Number(payload.metered_events) || 0,
      generated_at: new Date().toISOString(),
    };
  }
}

export const meteringEngine = new MeteringEngine();
