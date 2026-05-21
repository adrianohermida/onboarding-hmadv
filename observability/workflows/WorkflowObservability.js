import { createTracePayload } from '../../shared/contracts/observability/TraceContracts.js';

const MAX_WORKFLOWS = 600;

export class WorkflowObservability {
  constructor() {
    this._executions = [];
  }

  start(workflow_name, meta = {}) {
    const trace = createTracePayload(meta);
    const execution = {
      workflow_id: meta.workflow_id || `wf_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`,
      workflow_name,
      trace_id: trace.trace_id,
      actor_id: trace.actor_id,
      tenant_id: trace.tenant_id,
      correlation_id: trace.correlation_id,
      request_id: trace.request_id,
      status: 'running',
      retries: 0,
      failures: 0,
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      completed_at: null,
    };

    this._executions.unshift(execution);
    if (this._executions.length > MAX_WORKFLOWS) this._executions.length = MAX_WORKFLOWS;
    return execution;
  }

  complete(workflow_id) {
    this._update(workflow_id, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  fail(workflow_id, error = null) {
    const current = this._executions.find((item) => item.workflow_id === workflow_id);
    if (!current) return;
    this._update(workflow_id, {
      status: 'failed',
      failures: current.failures + 1,
      last_error: error ? String(error) : 'unknown',
      updated_at: new Date().toISOString(),
    });
  }

  retry(workflow_id) {
    const current = this._executions.find((item) => item.workflow_id === workflow_id);
    if (!current) return;
    this._update(workflow_id, {
      status: 'running',
      retries: current.retries + 1,
      updated_at: new Date().toISOString(),
    });
  }

  _update(workflow_id, patch) {
    this._executions = this._executions.map((item) => (
      item.workflow_id === workflow_id ? { ...item, ...patch } : item
    ));
  }

  snapshot() {
    return {
      running: this._executions.filter((item) => item.status === 'running').length,
      failed: this._executions.filter((item) => item.status === 'failed').length,
      completed: this._executions.filter((item) => item.status === 'completed').length,
      list: [...this._executions],
    };
  }
}

export const workflowObservability = new WorkflowObservability();
