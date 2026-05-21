export class ClientAssistantFoundation {
  getAssistants() {
    return [
      { key: 'onboarding', name: 'Assistente de onboarding', scope: 'onboarding' },
      { key: 'financeiro', name: 'Assistente financeiro', scope: 'financeiro' },
      { key: 'documentos', name: 'Assistente de documentos', scope: 'documentos' },
      { key: 'jornada', name: 'Assistente de jornada', scope: 'journey' },
    ];
  }
}

export const clientAssistantFoundation = new ClientAssistantFoundation();
