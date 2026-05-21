class QuickActionsEngine {
  snapshot(payload = {}) {
    const actions = Array.isArray(payload.actions) ? payload.actions : [
      { key: 'client.create', label: 'Criar cliente' },
      { key: 'onboarding.start', label: 'Iniciar onboarding' },
      { key: 'invite.send', label: 'Enviar convite' },
      { key: 'document.approve', label: 'Aprovar documento' },
      { key: 'timeline.open', label: 'Abrir timeline' },
      { key: 'financial.open', label: 'Abrir financeiro' },
      { key: 'task.create', label: 'Criar tarefa' },
      { key: 'notification.send', label: 'Enviar notificacao' },
    ];
    return {
      total: actions.length,
      list: actions,
      smart_actions_ready: true,
      generated_at: new Date().toISOString(),
    };
  }
}

export const quickActionsEngine = new QuickActionsEngine();
