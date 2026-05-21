export class AiAnalyticsFoundation {
  snapshot(payload = {}) {
    return {
      copilot_usage: Number(payload.copilot_usage) || 0,
      ai_productivity: Number(payload.ai_productivity) || 0,
      assisted_onboarding: Number(payload.assisted_onboarding) || 0,
      support_deflection: Number(payload.support_deflection) || 0,
      ai_latency_ms: Number(payload.ai_latency_ms) || 0,
      ai_review_rate: Number(payload.ai_review_rate) || 0,
      generated_at: new Date().toISOString(),
    };
  }
}

export const aiAnalyticsFoundation = new AiAnalyticsFoundation();
