export const PARSER_TYPES = ['pdf', 'image', 'spreadsheet', 'cnj_form', 'legal_future'];

export function parseDocumentStub(payload = {}) {
  return {
    document_id: payload.document_id || null,
    tenant_id: payload.tenant_id || 'hmadv',
    parser: payload.parser || 'pdf',
    parsed: false,
    status: 'planned',
    created_at: new Date().toISOString(),
  };
}
