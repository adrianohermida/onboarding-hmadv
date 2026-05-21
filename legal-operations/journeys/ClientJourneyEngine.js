const STAGES = [
  'onboarding',
  'educacao_financeira',
  'coleta_documentos',
  'diagnostico',
  'negociacao',
  'audiencia',
  'cumprimento_plano',
  'pos_acordo',
];

export class ClientJourneyEngine {
  constructor() {
    this._items = [];
  }

  upsert(payload = {}) {
    const tenant_id = payload.tenant_id || 'hmadv';
    const case_id = payload.case_id || null;
    const existing = this._items.find((entry) => entry.tenant_id === tenant_id && entry.case_id === case_id);
    const currentStage = STAGES.includes(payload.stage) ? payload.stage : 'onboarding';

    if (existing) {
      existing.stage = currentStage;
      existing.progress = Math.max(0, Math.min(100, Number(payload.progress ?? existing.progress ?? 0)));
      existing.updated_at = new Date().toISOString();
      return existing;
    }

    const item = {
      journey_id: payload.journey_id || `journey_${Date.now()}`,
      tenant_id,
      case_id,
      client_id: payload.client_id || null,
      stage: currentStage,
      progress: Math.max(0, Math.min(100, Number(payload.progress) || 0)),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this._items.unshift(item);
    return item;
  }

  list(tenant_id = null) {
    if (!tenant_id) return [...this._items];
    return this._items.filter((entry) => entry.tenant_id === tenant_id);
  }
}

export const clientJourneyEngine = new ClientJourneyEngine();
