export class ClientSuccessEngine {
  snapshot({ journeys = [], engagement = [], feedback = [], retention = [] } = {}) {
    const completedOnboarding = journeys.filter((entry) => entry.stage !== 'onboarding' && entry.stage !== 'entrada').length;
    const lowEngagement = retention.filter((entry) => entry.risk_level === 'high').length;

    return {
      onboarding_completion_rate: journeys.length ? completedOnboarding / journeys.length : 0,
      progression_index: journeys.length ? completedOnboarding / journeys.length : 0,
      abandonment_risk: retention.length ? lowEngagement / retention.length : 0,
      engagement_volume: engagement.length,
      satisfaction_signals: feedback.length,
      generated_at: new Date().toISOString(),
    };
  }
}

export const clientSuccessEngine = new ClientSuccessEngine();
