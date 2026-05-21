export class ContextEngine {
  compose(payload = {}) {
    return {
      tenant_id: payload.tenant_id || 'hmadv',
      client: payload.client || null,
      onboarding: payload.onboarding || {},
      documents: payload.documents || {},
      debts: payload.debts || {},
      financial_score: payload.financial_score || {},
      timelines: payload.timelines || {},
      workflows: payload.workflows || {},
      negotiations: payload.negotiations || {},
      notifications: payload.notifications || {},
      progress: payload.progress || {},
      generated_at: new Date().toISOString(),
    };
  }
}

export const contextEngine = new ContextEngine();
