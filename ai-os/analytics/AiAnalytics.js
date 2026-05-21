export class AiAnalytics {
  snapshot({ telemetry = {}, onboarding = {}, workflow = {}, financial = {} } = {}) {
    return {
      onboarding_assistance: Number(onboarding.assistance || 0),
      abandonment_reduction_signal: Number(onboarding.abandonment_reduction_signal || 0),
      workflow_productivity_signal: Number(workflow.productivity || 0),
      support_deflection_signal: Number(workflow.support_deflection || 0),
      financial_engagement_signal: Number(financial.engagement || 0),
      ai_failures: Number(telemetry.failures || 0),
      generated_at: new Date().toISOString(),
    };
  }
}

export const aiAnalytics = new AiAnalytics();
