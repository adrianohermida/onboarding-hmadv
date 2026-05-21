const MAX_APPROVALS = 800;

export class ApprovalEngine {
  constructor() {
    this._approvals = [];
  }

  requestApproval(payload = {}) {
    const approval = {
      approval_id: payload.approval_id || `apv_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`,
      type: payload.type || 'onboarding',
      tenant_id: payload.tenant_id || 'hmadv',
      workflow_id: payload.workflow_id || null,
      owner: payload.owner || 'operations',
      status: 'pending',
      requested_at: new Date().toISOString(),
      decided_at: null,
      decision_by: null,
      decision_reason: null,
    };

    this._approvals.unshift(approval);
    if (this._approvals.length > MAX_APPROVALS) this._approvals.length = MAX_APPROVALS;
    return approval;
  }

  decide(approval_id, status, actor = 'system', reason = null) {
    const valid = ['approved', 'rejected'];
    if (!valid.includes(status)) throw new Error(`invalid approval status: ${status}`);

    this._approvals = this._approvals.map((item) => (
      item.approval_id === approval_id
        ? {
            ...item,
            status,
            decided_at: new Date().toISOString(),
            decision_by: actor,
            decision_reason: reason,
          }
        : item
    ));
  }

  list(status = null) {
    if (!status) return [...this._approvals];
    return this._approvals.filter((item) => item.status === status);
  }
}

export const approvalEngine = new ApprovalEngine();
