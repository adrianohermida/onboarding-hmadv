import { workflowEngine } from '../../events/workflows/WorkflowEngine.js';
import { workflowTelemetry } from '../telemetry/WorkflowTelemetry.js';
import { workflowAuditTrail } from '../audit/WorkflowAuditTrail.js';

export class WorkflowExecutor {
  async execute(name, context = {}) {
    const start = Date.now();
    try {
      const result = await workflowEngine.run(name, context);
      workflowTelemetry.record({
        workflow: name,
        latency_ms: Date.now() - start,
        throughput: 1,
        tenant_id: context.tenant_id || 'hmadv',
        trace_id: context.trace_id || context.correlation_id || null,
      });
      workflowAuditTrail.append({
        workflow: name,
        workflow_id: result.workflowId,
        actor: context.actor || 'system',
        tenant_id: context.tenant_id || 'hmadv',
        transition: 'completed',
        trace_id: context.trace_id || context.correlation_id || null,
      });
      return result;
    } catch (error) {
      workflowTelemetry.record({
        workflow: name,
        latency_ms: Date.now() - start,
        failures: 1,
        throughput: 1,
        tenant_id: context.tenant_id || 'hmadv',
        trace_id: context.trace_id || context.correlation_id || null,
      });
      workflowAuditTrail.append({
        workflow: name,
        workflow_id: context.workflow_id || null,
        actor: context.actor || 'system',
        tenant_id: context.tenant_id || 'hmadv',
        transition: 'failed',
        trace_id: context.trace_id || context.correlation_id || null,
        details: { error: String(error) },
      });
      throw error;
    }
  }
}

export const workflowExecutor = new WorkflowExecutor();
