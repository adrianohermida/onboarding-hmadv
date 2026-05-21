export class ClientExperienceAnalytics {
  snapshot({ journeys = [], progress = [], engagement = [], feedback = [], retention = [], vulnerability = [] } = {}) {
    const completedJourney = journeys.filter((entry) => ['diagnostico', 'negociacao', 'acompanhamento', 'recuperacao_financeira'].includes(entry.stage)).length;
    const completedProgress = progress.filter((entry) => entry.completed).length;
    const highRetentionRisk = retention.filter((entry) => entry.risk_level === 'high').length;
    const uploadFriction = vulnerability.filter((entry) => entry.upload_difficulty).length;
    const avgFeedback = feedback.length
      ? feedback.reduce((acc, entry) => acc + (Number(entry.score) || 0), 0) / feedback.length
      : 0;

    return {
      onboarding_abandonment_rate: journeys.length ? highRetentionRisk / journeys.length : 0,
      completion_rate: journeys.length ? completedJourney / journeys.length : 0,
      upload_friction_rate: journeys.length ? uploadFriction / journeys.length : 0,
      engagement_volume: engagement.length,
      satisfaction_index: avgFeedback,
      progress_rate: progress.length ? completedProgress / progress.length : 0,
      generated_at: new Date().toISOString(),
    };
  }
}

export const clientExperienceAnalytics = new ClientExperienceAnalytics();
