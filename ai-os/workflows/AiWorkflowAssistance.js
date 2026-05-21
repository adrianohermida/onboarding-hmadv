export class AiWorkflowAssistance {
  suggest(payload = {}) {
    return {
      workflow_id: payload.workflow_id || null,
      suggestions: payload.suggestions || [
        'Revisar documentos faltantes.',
        'Confirmar pendencias de onboarding.',
        'Programar follow-up de negociacao.',
      ],
      prohibited_actions: ['auto_approve', 'auto_homologate', 'auto_finalize_legal'],
      requires_human_review: true,
      timestamp: new Date().toISOString(),
    };
  }
}

export const aiWorkflowAssistance = new AiWorkflowAssistance();
