import { retryEngine } from '../retries/RetryEngine.js';
import { eventLogger } from '../logs/EventLogger.js';
import { workflowObservability } from '../../observability/workflows/WorkflowObservability.js';
import { telemetryEngine } from '../../observability/telemetry/TelemetryEngine.js';

export class WorkflowEngine {
  constructor() {
    this._definitions = new Map();
    this._audit = [];
  }

  register(definition) {
    if (!definition?.name) throw new Error('workflow name is required');
    this._definitions.set(definition.name, definition);
  }

  async run(name, context = {}) {
    const definition = this._definitions.get(name);
    if (!definition) throw new Error(`workflow not registered: ${name}`);

    const workflowId = context.workflow_id || `${name}_${Date.now()}`;
    workflowObservability.start(name, {
      ...context,
      workflow_id: workflowId,
      source_module: context.source_module || 'tarefas',
    });
    const state = { workflowId, name, context, steps: [] };
    const startedAt = Date.now();

    for (const step of definition.steps || []) {
      const stepStart = Date.now();
      try {
        await retryEngine.run(() => step.run(state), { event: `${name}.${step.name}` });
        const item = { step: step.name, status: 'completed', ts: new Date().toISOString(), ms: Date.now() - stepStart };
        state.steps.push(item);
        this._audit.push({ workflowId, ...item });
      } catch (error) {
        const item = { step: step.name, status: 'failed', ts: new Date().toISOString(), ms: Date.now() - stepStart, error: String(error) };
        state.steps.push(item);
        this._audit.push({ workflowId, ...item });
        eventLogger.log('workflow.failed', `${name}.${step.name}`, { workflowId, error: String(error) });
        workflowObservability.fail(workflowId, error);
        telemetryEngine.trackWorkflowTiming(name, Date.now() - startedAt, {
          tenant_id: context.tenant_id || 'hmadv',
          trace_id: context.trace_id || context.correlation_id || null,
        });
        throw error;
      }
    }

    eventLogger.log('workflow.completed', name, { workflowId, ms: Date.now() - startedAt });
    workflowObservability.complete(workflowId);
    telemetryEngine.trackWorkflowTiming(name, Date.now() - startedAt, {
      tenant_id: context.tenant_id || 'hmadv',
      trace_id: context.trace_id || context.correlation_id || null,
    });
    return state;
  }

  getAuditTrail() {
    return [...this._audit];
  }
}

export const workflowEngine = new WorkflowEngine();
