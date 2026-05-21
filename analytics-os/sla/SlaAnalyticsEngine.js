export class SlaAnalyticsEngine {
  snapshot(payload = {}) {
    return {
      onboarding_sla: Number(payload.onboarding_sla) || 0,
      review_sla: Number(payload.review_sla) || 0,
      signature_sla: Number(payload.signature_sla) || 0,
      negotiation_sla: Number(payload.negotiation_sla) || 0,
      support_sla: Number(payload.support_sla) || 0,
      generated_at: new Date().toISOString(),
    };
  }
}

export const slaAnalyticsEngine = new SlaAnalyticsEngine();
