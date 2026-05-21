const CASE_STATES = [
  'lead',
  'invited',
  'onboarding',
  'onboarding_review',
  'financial_analysis',
  'negotiation',
  'legal_preparation',
  'hearing_preparation',
  'agreement_pending',
  'agreement_signed',
  'monitoring',
  'completed',
  'archived',
];

const MAX_CASES = 4000;

export class CaseEngine {
  constructor() {
    this._items = [];
  }

  create(payload = {}) {
    const item = {
      case_id: payload.case_id || `case_${Date.now()}`,
      tenant_id: payload.tenant_id || 'hmadv',
      client_id: payload.client_id || null,
      lawyer_id: payload.lawyer_id || null,
      operator_id: payload.operator_id || null,
      status: CASE_STATES.includes(payload.status) ? payload.status : 'lead',
      workflow: payload.workflow || 'superendividamento.lifecycle',
      risk_score: Number(payload.risk_score) || 0,
      urgency_score: Number(payload.urgency_score) || 0,
      onboarding_state: payload.onboarding_state || 'not_started',
      financial_state: payload.financial_state || 'not_started',
      documents_state: payload.documents_state || 'not_started',
      negotiation_state: payload.negotiation_state || 'not_started',
      hearing_state: payload.hearing_state || 'not_scheduled',
      payment_plan_state: payload.payment_plan_state || 'not_generated',
      timeline_enabled: true,
      observability_enabled: true,
      tracing_enabled: true,
      created_by: payload.actor_id || 'system',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this._items.unshift(item);
    if (this._items.length > MAX_CASES) this._items.length = MAX_CASES;
    return item;
  }

  transition(case_id, nextStatus, actor_id = 'system') {
    const item = this._items.find((entry) => entry.case_id === case_id);
    if (!item || !CASE_STATES.includes(nextStatus)) return null;
    item.status = nextStatus;
    item.updated_at = new Date().toISOString();
    item.updated_by = actor_id;
    return item;
  }

  updateStates(case_id, patch = {}, actor_id = 'system') {
    const item = this._items.find((entry) => entry.case_id === case_id);
    if (!item) return null;
    Object.assign(item, {
      onboarding_state: patch.onboarding_state ?? item.onboarding_state,
      financial_state: patch.financial_state ?? item.financial_state,
      documents_state: patch.documents_state ?? item.documents_state,
      negotiation_state: patch.negotiation_state ?? item.negotiation_state,
      hearing_state: patch.hearing_state ?? item.hearing_state,
      payment_plan_state: patch.payment_plan_state ?? item.payment_plan_state,
      risk_score: patch.risk_score ?? item.risk_score,
      urgency_score: patch.urgency_score ?? item.urgency_score,
      updated_at: new Date().toISOString(),
      updated_by: actor_id,
    });
    return item;
  }

  get(case_id) {
    return this._items.find((entry) => entry.case_id === case_id) || null;
  }

  list(tenant_id = null) {
    if (!tenant_id) return [...this._items];
    return this._items.filter((entry) => entry.tenant_id === tenant_id);
  }
}

export const caseEngine = new CaseEngine();
export { CASE_STATES };
