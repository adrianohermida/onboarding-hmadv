export class ClientRecoveryAnalytics {
  snapshot(payload = {}) {
    return {
      financial_recovery_progress: Number(payload.financial_recovery_progress) || 0,
      score_improvement: Number(payload.score_improvement) || 0,
      renegotiation_progress: Number(payload.renegotiation_progress) || 0,
      commitment_reduction: Number(payload.commitment_reduction) || 0,
      client_progress_index: Number(payload.client_progress_index) || 0,
      generated_at: new Date().toISOString(),
    };
  }
}

export const clientRecoveryAnalytics = new ClientRecoveryAnalytics();
