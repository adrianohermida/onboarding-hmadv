const SLA_POLICIES = {
  onboarding_review: { target_ms: 48 * 60 * 60 * 1000 },
  document_review: { target_ms: 24 * 60 * 60 * 1000 },
  signature_pending: { target_ms: 72 * 60 * 60 * 1000 },
  financial_analysis: { target_ms: 72 * 60 * 60 * 1000 },
  support_resolution: { target_ms: 24 * 60 * 60 * 1000 },
  payment_plan_generation: { target_ms: 48 * 60 * 60 * 1000 },
};

export class SlaEngine {
  constructor() {
    this._items = [];
  }

  track(entry = {}) {
    const item = {
      workflow: entry.workflow || 'unknown',
      stage: entry.stage || 'unknown',
      tenant_id: entry.tenant_id || 'hmadv',
      started_at: entry.started_at || new Date().toISOString(),
      finished_at: entry.finished_at || null,
      elapsed_ms: Number(entry.elapsed_ms) || 0,
      deadline_at: entry.deadline_at || null,
      overdue: !!entry.overdue,
      escalation_path: entry.escalation_path || 'manager->admin',
    };
    this._items.unshift(item);
    if (this._items.length > 1000) this._items.length = 1000;
    return item;
  }

  evaluateOverdue(now = Date.now()) {
    return this._items.filter((item) => {
      const deadline = item.deadline_at ? Date.parse(item.deadline_at) : null;
      return deadline && deadline < now && !item.finished_at;
    });
  }

  policy(stage) {
    return SLA_POLICIES[stage] || null;
  }

  snapshot() {
    const overdue = this.evaluateOverdue();
    return {
      total: this._items.length,
      overdue: overdue.length,
      policies: SLA_POLICIES,
      list: [...this._items],
    };
  }
}

export const slaEngine = new SlaEngine();
