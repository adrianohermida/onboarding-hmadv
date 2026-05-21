export class KpiFoundation {
  snapshot({ onboarding = {}, financial = {}, legal = {}, client = {} } = {}) {
    return {
      onboarding: {
        completion_rate: Number(onboarding.completion_rate) || 0,
        abandonment_rate: Number(onboarding.abandonment_rate) || 0,
        avg_time_hours: Number(onboarding.avg_time_hours) || 0,
        pending_documents: Number(onboarding.pending_documents) || 0,
      },
      financial: {
        avg_commitment: Number(financial.avg_commitment) || 0,
        aggravation_index: Number(financial.aggravation_index) || 0,
        avg_score: Number(financial.avg_score) || 0,
        minimum_existential_index: Number(financial.minimum_existential_index) || 0,
      },
      legal: {
        avg_workflow_time_hours: Number(legal.avg_workflow_time_hours) || 0,
        agreements: Number(legal.agreements) || 0,
        negotiations: Number(legal.negotiations) || 0,
        productivity: Number(legal.productivity) || 0,
      },
      client: {
        satisfaction: Number(client.satisfaction) || 0,
        engagement: Number(client.engagement) || 0,
        retention: Number(client.retention) || 0,
        reactivation: Number(client.reactivation) || 0,
      },
      generated_at: new Date().toISOString(),
    };
  }
}

export const kpiFoundation = new KpiFoundation();
