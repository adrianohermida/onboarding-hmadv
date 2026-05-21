export class EligibilityEngine {
  analyze(payload = {}) {
    const commitment = Number(payload.commitment_after_minimum) || 0;
    const vulnerability = Number(payload.vulnerability) || 0;
    const minimumCompromised = !!payload.minimum_existential_compromised;

    const superendividamento = commitment > 0.7 || minimumCompromised;
    const gratuitidadeJustica = vulnerability > 60 || commitment > 0.8;

    return {
      tenant_id: payload.tenant_id || 'hmadv',
      lei_superendividamento: superendividamento,
      gratuidade_justica: gratuitidadeJustica,
      preservacao_minimo_existencial: !minimumCompromised,
      vulnerabilidade_economica: vulnerability,
      eligible: superendividamento,
      evaluated_at: new Date().toISOString(),
    };
  }
}

export const eligibilityEngine = new EligibilityEngine();
