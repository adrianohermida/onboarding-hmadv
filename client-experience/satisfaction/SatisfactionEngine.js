export class SatisfactionEngine {
  snapshot({ feedback = [], engagement = [], notifications = [] } = {}) {
    const avgScore = feedback.length
      ? feedback.reduce((acc, entry) => acc + (Number(entry.score) || 0), 0) / feedback.length
      : 0;

    return {
      satisfaction_index: avgScore,
      confidence_index: Math.max(0, Math.min(100, 60 + feedback.length + engagement.length - notifications.length / 4)),
      abandonment_signal: avgScore < 5 ? 'high' : 'low',
      retention_signal: avgScore >= 7 ? 'strong' : 'at_risk',
      engagement_signal: engagement.length,
      generated_at: new Date().toISOString(),
    };
  }
}

export const satisfactionEngine = new SatisfactionEngine();
