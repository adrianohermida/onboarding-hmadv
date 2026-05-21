const KNOWLEDGE_DOMAINS = {
  superendividamento: ['conceitos_basicos', 'direitos_consumidor', 'renegociacao'],
  cnj: ['anexo_ii', 'cartilha_cnj', 'formulario_cnj', 'faq_cnj', 'videos_cnj'],
  onboarding: ['passo_a_passo', 'uploads', 'assinatura'],
  financeiro: ['minimo_existencial', 'comprometimento_renda', 'despesas_essenciais'],
  gratuidade: ['requisitos', 'documentacao', 'peticao_base'],
  documentos: ['tipos', 'validacao', 'correcao'],
  faq: ['acesso', 'prazo', 'suporte'],
  treinamentos: ['playbooks_internos', 'rotinas_operacionais'],
  videos: ['onboarding_video_1', 'onboarding_video_2'],
  templates: ['modelo_peticao', 'modelo_plano_pagamento'],
};

export function listKnowledgeDomains() {
  return Object.keys(KNOWLEDGE_DOMAINS);
}

export function listKnowledgeByDomain(domain) {
  return KNOWLEDGE_DOMAINS[domain] || [];
}

export function buildKnowledgeEntry(payload = {}) {
  return {
    id: payload.id || `kb_${Date.now()}`,
    domain: payload.domain || 'faq',
    title: payload.title || 'Knowledge entry',
    content_type: payload.content_type || 'article',
    tenant_id: payload.tenant_id || 'hmadv',
    owner_id: payload.owner_id || 'knowledge-team',
    tags: Array.isArray(payload.tags) ? payload.tags : [],
    lifecycle_state: payload.lifecycle_state || 'published',
    created_at: new Date().toISOString(),
  };
}
