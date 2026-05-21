export const CASE_STATES = [
  'draft',
  'invited',
  'onboarding_started',
  'onboarding_pending',
  'onboarding_review',
  'onboarding_approved',
  'financial_analysis',
  'documents_pending',
  'plan_generation',
  'negotiation',
  'legal_review',
  'active',
  'completed',
  'archived',
];

const ALLOWED_TRANSITIONS = {
  draft: ['invited'],
  invited: ['onboarding_started'],
  onboarding_started: ['onboarding_pending', 'onboarding_review'],
  onboarding_pending: ['onboarding_review'],
  onboarding_review: ['onboarding_approved', 'onboarding_pending'],
  onboarding_approved: ['financial_analysis', 'documents_pending'],
  financial_analysis: ['documents_pending', 'plan_generation'],
  documents_pending: ['plan_generation', 'onboarding_pending'],
  plan_generation: ['negotiation', 'legal_review'],
  negotiation: ['legal_review', 'active'],
  legal_review: ['active', 'plan_generation'],
  active: ['completed', 'archived'],
  completed: ['archived'],
  archived: [],
};

export class CaseLifecycleMachine {
  constructor() {
    this._cases = new Map();
  }

  start(case_id, context = {}) {
    const item = {
      case_id,
      tenant_id: context.tenant_id || 'hmadv',
      state: 'draft',
      history: [{ from: null, to: 'draft', at: new Date().toISOString(), actor: context.actor || 'system' }],
      updated_at: new Date().toISOString(),
    };
    this._cases.set(case_id, item);
    return item;
  }

  transition(case_id, nextState, context = {}) {
    const current = this._cases.get(case_id) || this.start(case_id, context);
    if (!CASE_STATES.includes(nextState)) {
      throw new Error(`invalid case state: ${nextState}`);
    }

    const allowed = ALLOWED_TRANSITIONS[current.state] || [];
    if (!allowed.includes(nextState)) {
      throw new Error(`invalid transition: ${current.state} -> ${nextState}`);
    }

    const updated = {
      ...current,
      state: nextState,
      updated_at: new Date().toISOString(),
      history: [
        ...current.history,
        {
          from: current.state,
          to: nextState,
          at: new Date().toISOString(),
          actor: context.actor || 'system',
          tenant_id: context.tenant_id || current.tenant_id,
          workflow_id: context.workflow_id || null,
          trace_id: context.trace_id || null,
        },
      ],
    };

    this._cases.set(case_id, updated);
    return updated;
  }

  get(case_id) {
    return this._cases.get(case_id) || null;
  }

  snapshot() {
    const list = [...this._cases.values()];
    return {
      total: list.length,
      active: list.filter((item) => !['completed', 'archived'].includes(item.state)).length,
      completed: list.filter((item) => item.state === 'completed').length,
      archived: list.filter((item) => item.state === 'archived').length,
      list,
    };
  }
}

export const caseLifecycleMachine = new CaseLifecycleMachine();
