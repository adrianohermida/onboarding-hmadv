const MAX_JOURNEYS = 5000;

const JOURNEY_STAGES = [
  'entrada',
  'acolhimento',
  'onboarding',
  'educacao_financeira',
  'diagnostico',
  'negociacao',
  'acompanhamento',
  'recuperacao_financeira',
];

export class HumanizedJourneyEngine {
  constructor() {
    this._items = [];
  }

  register(payload = {}) {
    const stage = JOURNEY_STAGES.includes(payload.stage) ? payload.stage : 'entrada';
    const item = {
      journey_id: payload.journey_id || `cxj_${Date.now()}`,
      tenant_id: payload.tenant_id || 'hmadv',
      client_id: payload.client_id || null,
      case_id: payload.case_id || null,
      stage,
      status: payload.status || 'active',
      welcoming_score: Number(payload.welcoming_score) || 70,
      anxiety_reduction_score: Number(payload.anxiety_reduction_score) || 70,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this._items.unshift(item);
    if (this._items.length > MAX_JOURNEYS) this._items.length = MAX_JOURNEYS;
    return item;
  }

  list(tenant_id = null) {
    if (!tenant_id) return [...this._items];
    return this._items.filter((entry) => entry.tenant_id === tenant_id);
  }
}

export const humanizedJourneyEngine = new HumanizedJourneyEngine();
export { JOURNEY_STAGES };
