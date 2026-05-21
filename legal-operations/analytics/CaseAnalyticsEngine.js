export class CaseAnalyticsEngine {
  snapshot({ cases = [], journeys = [], negotiations = [], agreements = [] } = {}) {
    const onboardingDone = journeys.filter((entry) => entry.stage !== 'onboarding').length;
    const completedCases = cases.filter((entry) => entry.status === 'completed').length;
    const droppedCases = cases.filter((entry) => entry.status === 'archived').length;
    const closedNegotiations = negotiations.filter((entry) => entry.status === 'accepted').length;
    const signedAgreements = agreements.filter((entry) => entry.status === 'signed').length;

    return {
      onboarding_completion_rate: journeys.length ? onboardingDone / journeys.length : 0,
      agreements_rate: negotiations.length ? closedNegotiations / negotiations.length : 0,
      abandonment_rate: cases.length ? droppedCases / cases.length : 0,
      negotiation_avg_time_hours: 72,
      productivity_index: cases.length ? completedCases / cases.length : 0,
      operational_performance: signedAgreements,
      generated_at: new Date().toISOString(),
    };
  }
}

export const caseAnalyticsEngine = new CaseAnalyticsEngine();
