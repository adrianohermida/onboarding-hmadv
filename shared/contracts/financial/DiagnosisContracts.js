export function normalizeDiagnosisPayload(payload = {}) {
  return {
    tenant_id: payload.tenant_id || 'hmadv',
    superendividamento_situacao: !!payload.superendividamento_situacao,
    elegibilidade: payload.elegibilidade || null,
    vulnerabilidade: Number(payload.vulnerabilidade) || 0,
    risco_social: Number(payload.risco_social) || 0,
    comprometimento: payload.comprometimento || {},
    timestamp: payload.timestamp || new Date().toISOString(),
  };
}
