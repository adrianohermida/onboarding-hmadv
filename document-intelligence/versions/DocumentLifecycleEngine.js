export const DOCUMENT_LIFECYCLE_STATES = [
  'uploaded',
  'pending_review',
  'approved',
  'signed',
  'archived',
  'retained',
  'deleted_future',
];

const ALLOWED = {
  uploaded: ['pending_review', 'archived'],
  pending_review: ['approved', 'uploaded'],
  approved: ['signed', 'archived'],
  signed: ['archived', 'retained'],
  archived: ['retained', 'deleted_future'],
  retained: ['deleted_future'],
  deleted_future: [],
};

export class DocumentLifecycleEngine {
  constructor() {
    this._docs = new Map();
  }

  start(document_id, context = {}) {
    const item = {
      document_id,
      tenant_id: context.tenant_id || 'hmadv',
      state: 'uploaded',
      history: [{ from: null, to: 'uploaded', actor_id: context.actor_id || 'system', at: new Date().toISOString() }],
      updated_at: new Date().toISOString(),
    };
    this._docs.set(document_id, item);
    return item;
  }

  transition(document_id, nextState, context = {}) {
    const current = this._docs.get(document_id) || this.start(document_id, context);
    if (!DOCUMENT_LIFECYCLE_STATES.includes(nextState)) throw new Error(`invalid lifecycle state: ${nextState}`);
    if (!(ALLOWED[current.state] || []).includes(nextState)) throw new Error(`invalid lifecycle transition: ${current.state} -> ${nextState}`);

    const updated = {
      ...current,
      state: nextState,
      updated_at: new Date().toISOString(),
      history: [
        ...current.history,
        {
          from: current.state,
          to: nextState,
          actor_id: context.actor_id || 'system',
          tenant_id: context.tenant_id || current.tenant_id,
          workflow_id: context.workflow_id || null,
          trace_id: context.trace_id || null,
          at: new Date().toISOString(),
        },
      ],
    };
    this._docs.set(document_id, updated);
    return updated;
  }

  get(document_id) {
    return this._docs.get(document_id) || null;
  }

  snapshot() {
    const list = [...this._docs.values()];
    return {
      total: list.length,
      uploaded: list.filter((i) => i.state === 'uploaded').length,
      pending_review: list.filter((i) => i.state === 'pending_review').length,
      approved: list.filter((i) => i.state === 'approved').length,
      signed: list.filter((i) => i.state === 'signed').length,
      archived: list.filter((i) => i.state === 'archived').length,
      retained: list.filter((i) => i.state === 'retained').length,
      list,
    };
  }
}

export const documentLifecycleEngine = new DocumentLifecycleEngine();
