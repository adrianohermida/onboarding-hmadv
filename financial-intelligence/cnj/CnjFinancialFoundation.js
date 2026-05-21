export function buildCnjFinancialProfile(payload = {}) {
  return {
    tenant_id: payload.tenant_id || 'hmadv',
    anexo_ii: payload.anexo_ii || null,
    formulario_financeiro: payload.formulario_financeiro || null,
    plano_pagamento: payload.plano_pagamento || null,
    audiencia_conciliacao: payload.audiencia_conciliacao || null,
    diagnostico_financeiro: payload.diagnostico_financeiro || null,
    generated_at: new Date().toISOString(),
  };
}
