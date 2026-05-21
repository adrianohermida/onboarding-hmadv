export class EngagementAnalyticsEngine {
  snapshot(payload = {}) {
    return {
      accesses: Number(payload.accesses) || 0,
      notifications_open_rate: Number(payload.notifications_open_rate) || 0,
      retention_index: Number(payload.retention_index) || 0,
      onboarding_engagement: Number(payload.onboarding_engagement) || 0,
      financial_education_engagement: Number(payload.financial_education_engagement) || 0,
      platform_interaction: Number(payload.platform_interaction) || 0,
      generated_at: new Date().toISOString(),
    };
  }
}

export const engagementAnalyticsEngine = new EngagementAnalyticsEngine();
