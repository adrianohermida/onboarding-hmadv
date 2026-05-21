export class ClientExperienceGovernanceEngine {
  validateExperience(payload = {}) {
    const message = String(payload.message || '').toLowerCase();
    const hostileTokens = ['urgente agora', 'falha grave do cliente', 'inadimplente sem saida'];
    const containsHostileTone = hostileTokens.some((token) => message.includes(token));

    return {
      valid: !containsHostileTone,
      humanized_language: !containsHostileTone,
      accessibility: payload.accessibility !== false,
      observability: payload.observability !== false,
      onboarding_awareness: payload.onboarding_awareness !== false,
      progress_awareness: payload.progress_awareness !== false,
      tenant_aware: !!payload.tenant_id,
    };
  }
}

export const clientExperienceGovernanceEngine = new ClientExperienceGovernanceEngine();
