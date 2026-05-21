class ContextEngine {
  constructor() {
    this._context = {
      tenant_id: 'hmadv',
      operational: null,
      client: null,
      workflow: null,
      financial: null,
      onboarding: null,
    };
  }

  update(patch = {}) {
    this._context = { ...this._context, ...patch };
    return this.snapshot();
  }

  snapshot() {
    return {
      ...this._context,
      has_operational_context: !!this._context.operational,
      has_client_context: !!this._context.client,
      has_workflow_context: !!this._context.workflow,
      has_financial_context: !!this._context.financial,
      has_onboarding_context: !!this._context.onboarding,
      generated_at: new Date().toISOString(),
    };
  }
}

export const contextEngine = new ContextEngine();
