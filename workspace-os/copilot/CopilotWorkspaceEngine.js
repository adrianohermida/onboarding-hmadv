class CopilotWorkspaceEngine {
  suggest(payload = {}) {
    const suggestions = Array.isArray(payload.suggestions) ? payload.suggestions : [
      'Revisar onboarding parado',
      'Priorizar documentos pendentes',
      'Abrir workflow com SLA em risco',
    ];
    return {
      tenant_id: payload.tenant_id || 'hmadv',
      mode: payload.mode || 'contextual',
      context_type: payload.context_type || 'operational',
      summary: payload.summary || 'Assistencia contextual ativa.',
      next_steps: Array.isArray(payload.next_steps) ? payload.next_steps : suggestions,
      pending_items: Array.isArray(payload.pending_items) ? payload.pending_items : [],
      generated_at: new Date().toISOString(),
    };
  }
}

export const copilotWorkspaceEngine = new CopilotWorkspaceEngine();
