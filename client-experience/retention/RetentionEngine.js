const MAX_RETENTION_SIGNALS = 5000;

export class RetentionEngine {
  constructor() {
    this._items = [];
  }

  evaluate(payload = {}) {
    const inactivityDays = Number(payload.inactivity_days) || 0;
    const onboardingStalled = payload.onboarding_stalled === true;
    const engagementDrop = payload.engagement_drop === true;

    const risk_level = inactivityDays > 14 || onboardingStalled || engagementDrop ? 'high' : 'low';

    const item = {
      retention_id: payload.retention_id || `cxret_${Date.now()}`,
      tenant_id: payload.tenant_id || 'hmadv',
      client_id: payload.client_id || null,
      risk_level,
      inactivity_days: inactivityDays,
      onboarding_stalled: onboardingStalled,
      engagement_drop: engagementDrop,
      notes: payload.notes || '',
      timestamp: new Date().toISOString(),
    };

    this._items.unshift(item);
    if (this._items.length > MAX_RETENTION_SIGNALS) this._items.length = MAX_RETENTION_SIGNALS;
    return item;
  }

  list(tenant_id = null) {
    if (!tenant_id) return [...this._items];
    return this._items.filter((entry) => entry.tenant_id === tenant_id);
  }
}

export const retentionEngine = new RetentionEngine();
