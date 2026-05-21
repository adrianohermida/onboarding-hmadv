class ContextualActionsEngine {
  suggest(payload = {}) {
    const actions = Array.isArray(payload.actions) ? payload.actions : [
      { key: 'client.create', label: 'Criar cliente' },
      { key: 'onboarding.start', label: 'Iniciar onboarding' },
      { key: 'workflow.open-critical', label: 'Abrir workflow critico' },
    ];
    return {
      tenant_id: payload.tenant_id || 'hmadv',
      entity_type: payload.entity_type || 'workspace',
      quick_actions: actions,
      smart_suggestions: Array.isArray(payload.smart_suggestions) ? payload.smart_suggestions : [
        'Documentos pendentes acima do limiar operacional.',
        'Onboarding sem progresso nas ultimas 48h.',
      ],
      ai_assistance_ready: true,
      generated_at: new Date().toISOString(),
    };
  }
}

export const contextualActionsEngine = new ContextualActionsEngine();
