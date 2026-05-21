const LEGAL_TEMPLATES = [
  'juridico_padrao',
  'onboarding_welcome',
  'cnj_formulario',
  'plano_pagamento',
  'email_notificacao',
];

export class TemplateEngine {
  list() {
    return [...LEGAL_TEMPLATES];
  }

  build(name, payload = {}) {
    return {
      template: name,
      tenant_id: payload.tenant_id || 'hmadv',
      actor_id: payload.actor_id || 'system',
      data: payload.data || {},
      generated_at: new Date().toISOString(),
    };
  }
}

export const templateEngine = new TemplateEngine();
