class CreditSystemFoundation {
  snapshot(payload = {}) {
    return {
      ai_credits: Number(payload.ai_credits) || 0,
      workflow_credits: Number(payload.workflow_credits) || 0,
      onboarding_credits: Number(payload.onboarding_credits) || 0,
      storage_credits: Number(payload.storage_credits) || 0,
      generated_at: new Date().toISOString(),
    };
  }
}

export const creditSystemFoundation = new CreditSystemFoundation();
