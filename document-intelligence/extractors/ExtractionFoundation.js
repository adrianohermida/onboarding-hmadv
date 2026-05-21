export const EXTRACTION_FIELDS = [
  'cpf',
  'nome',
  'endereco',
  'renda',
  'divida',
];

export function buildExtractionPlan(payload = {}) {
  return {
    document_id: payload.document_id || null,
    tenant_id: payload.tenant_id || 'hmadv',
    fields: Array.isArray(payload.fields) && payload.fields.length ? payload.fields : EXTRACTION_FIELDS,
    status: 'planned',
    created_at: new Date().toISOString(),
  };
}
