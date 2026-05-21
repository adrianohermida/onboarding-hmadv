export const DOCUMENT_TAXONOMY = {
  identidade: ['rg', 'cpf', 'cnh', 'passaporte'],
  financeiro: ['holerite', 'extrato_bancario', 'contracheque', 'declaracao_ir'],
  residencial: ['conta_agua', 'conta_energia', 'contrato_aluguel'],
  juridico: ['procuracao', 'contrato', 'peticao', 'plano_pagamento'],
  cnj: ['formulario_cnj', 'anexo_ii', 'documentos_audiencia'],
};

export function listTaxonomyCategories() {
  return Object.keys(DOCUMENT_TAXONOMY);
}

export function listDocumentTypesByCategory(category) {
  return DOCUMENT_TAXONOMY[category] || [];
}

export function resolveDocumentCategory(type) {
  const normalized = String(type || '').toLowerCase().trim();
  const found = Object.entries(DOCUMENT_TAXONOMY).find(([, types]) => types.includes(normalized));
  return found ? found[0] : null;
}

export function isValidTaxonomyType(type) {
  return !!resolveDocumentCategory(type);
}
