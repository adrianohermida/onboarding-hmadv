const MAX_MEMORY_ITEMS = 5000;

export class MemoryFoundation {
  constructor() {
    this._session = [];
    this._workflow = [];
    this._case = [];
    this._interaction = [];
    this._onboarding = [];
  }

  track(scope = 'session', payload = {}) {
    const entry = {
      memory_id: payload.memory_id || `ai_mem_${Date.now()}`,
      tenant_id: payload.tenant_id || 'hmadv',
      scope,
      data: payload.data || {},
      timestamp: new Date().toISOString(),
    };

    const target =
      scope === 'workflow' ? this._workflow :
      scope === 'case' ? this._case :
      scope === 'interaction' ? this._interaction :
      scope === 'onboarding' ? this._onboarding :
      this._session;

    target.unshift(entry);
    if (target.length > MAX_MEMORY_ITEMS) target.length = MAX_MEMORY_ITEMS;
    return entry;
  }

  snapshot(tenant_id = 'hmadv') {
    const byTenant = (list) => list.filter((entry) => entry.tenant_id === tenant_id);
    return {
      session: byTenant(this._session),
      workflow: byTenant(this._workflow),
      case_memory: byTenant(this._case),
      interaction: byTenant(this._interaction),
      onboarding: byTenant(this._onboarding),
    };
  }
}

export const memoryFoundation = new MemoryFoundation();
