export class OnboardingAnalyticsEngine {
  snapshot(payload = {}) {
    return {
      abandonment_rate: Number(payload.abandonment_rate) || 0,
      completion_rate: Number(payload.completion_rate) || 0,
      uploads: Number(payload.uploads) || 0,
      watched_videos: Number(payload.watched_videos) || 0,
      onboarding_bottlenecks: Number(payload.onboarding_bottlenecks) || 0,
      rejected_documents: Number(payload.rejected_documents) || 0,
      generated_at: new Date().toISOString(),
    };
  }
}

export const onboardingAnalyticsEngine = new OnboardingAnalyticsEngine();
