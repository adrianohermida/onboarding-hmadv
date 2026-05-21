const MAX_RISK = 10000;

export class RiskGovernanceEngine {
  constructor() {
    this._items = [];
  }

  assess(payload = {}) {
    const item = {
      risk_id: payload.risk_id || `rsk_${Date.now()}`,
      tenant_id: payload.tenant_id || 'hmadv',
      operational_risk: Number(payload.operational_risk) || 0,
      lgpd_risk: Number(payload.lgpd_risk) || 0,
      access_risk: Number(payload.access_risk) || 0,
      integration_risk: Number(payload.integration_risk) || 0,
      ai_risk: Number(payload.ai_risk) || 0,
      leakage_risk: Number(payload.leakage_risk) || 0,
      workflow_risk: Number(payload.workflow_risk) || 0,
      timestamp: new Date().toISOString(),
    };

    this._items.unshift(item);
    if (this._items.length > MAX_RISK) this._items.length = MAX_RISK;
    return item;
  }

  list(tenant_id = null) {
    if (!tenant_id) return [...this._items];
    return this._items.filter((entry) => entry.tenant_id === tenant_id);
  }
}

export const riskGovernanceEngine = new RiskGovernanceEngine();
