const MAX_TELEMETRY = 8000;

export class CaseTelemetry {
  constructor() {
    this._items = [];
  }

  track(payload = {}) {
    const item = {
      telemetry_id: payload.telemetry_id || `ltele_${Date.now()}`,
      event: payload.event || 'legal.telemetry',
      tenant_id: payload.tenant_id || 'hmadv',
      case_id: payload.case_id || null,
      actor_id: payload.actor_id || 'system',
      workflow_state: payload.workflow_state || null,
      financial_state: payload.financial_state || null,
      onboarding_state: payload.onboarding_state || null,
      risk_state: payload.risk_state || null,
      inputs: payload.inputs || {},
      outputs: payload.outputs || {},
      trace_id: payload.trace_id || payload.correlation_id || null,
      timestamp: new Date().toISOString(),
    };
    this._items.unshift(item);
    if (this._items.length > MAX_TELEMETRY) this._items.length = MAX_TELEMETRY;
    return item;
  }

  snapshot(tenant_id = null) {
    const list = tenant_id
      ? this._items.filter((entry) => entry.tenant_id === tenant_id)
      : this._items;

    return {
      total: list.length,
      transitions: list.filter((entry) => entry.event.includes('transition')).length,
      uploads: list.filter((entry) => entry.event.includes('upload')).length,
      revisions: list.filter((entry) => entry.event.includes('review')).length,
      negotiations: list.filter((entry) => entry.event.includes('negotiation')).length,
      approvals: list.filter((entry) => entry.event.includes('approval')).length,
      tasks: list.filter((entry) => entry.event.includes('task')).length,
      sla: list.filter((entry) => entry.event.includes('sla')).length,
      list: [...list],
    };
  }
}

export const caseTelemetry = new CaseTelemetry();
