import { workflowTelemetry } from './telemetry/WorkflowTelemetry.js';
import { workflowAuditTrail } from './audit/WorkflowAuditTrail.js';
import { caseLifecycleMachine } from './state-machines/cases/CaseLifecycleMachine.js';
import { caseTimelineEngine } from './timeline/CaseTimelineEngine.js';
import { slaEngine } from './sla/SlaEngine.js';
import { humanTaskEngine } from './human-tasks/HumanTaskEngine.js';
import { approvalEngine } from './approvals/ApprovalEngine.js';
import { escalationEngine } from './escalations/EscalationEngine.js';
import { workflowQueue } from './queues/WorkflowQueue.js';
import { schedulerFoundation } from './schedulers/SchedulerFoundation.js';
import { listWorkflowDefinitions } from './definitions/WorkflowDefinitions.js';
import { mountWorkflowProcessOrchestrator, unmountWorkflowProcessOrchestrator } from './orchestrators/WorkflowProcessOrchestrator.js';
import { mountFreshdeskWorkflowOrchestration, unmountFreshdeskWorkflowOrchestration } from './orchestrators/FreshdeskWorkflowOrchestration.js';

let mounted = false;

export function mountWorkflowAutomationFoundation() {
  if (mounted) return;
  mounted = true;
  mountWorkflowProcessOrchestrator();
  mountFreshdeskWorkflowOrchestration();
}

export function unmountWorkflowAutomationFoundation() {
  unmountWorkflowProcessOrchestrator();
  unmountFreshdeskWorkflowOrchestration();
  mounted = false;
}

export function collectWorkflowSnapshot() {
  const tasks = humanTaskEngine.list();
  const approvals = approvalEngine.list();
  const escalations = escalationEngine.list();

  return {
    definitions: listWorkflowDefinitions(),
    lifecycle: caseLifecycleMachine.snapshot(),
    telemetry: workflowTelemetry.snapshot(),
    audit: { total: workflowAuditTrail.list().length },
    timeline: { total: caseTimelineEngine.list().length },
    sla: slaEngine.snapshot(),
    tasks: {
      total: tasks.length,
      open: tasks.filter((item) => item.status === 'open').length,
      overdue: tasks.filter((item) => item.status === 'open' && item.deadline && Date.parse(item.deadline) < Date.now()).length,
      list: tasks,
    },
    approvals: {
      total: approvals.length,
      pending: approvals.filter((item) => item.status === 'pending').length,
      list: approvals,
    },
    escalations: {
      total: escalations.length,
      open: escalations.filter((item) => item.status === 'open').length,
      list: escalations,
    },
    queue: {
      depth: workflowQueue.depth(),
    },
    scheduler: schedulerFoundation.runCycle(),
    generated_at: new Date().toISOString(),
  };
}

export const workflowAutomationFoundation = {
  mount: mountWorkflowAutomationFoundation,
  unmount: unmountWorkflowAutomationFoundation,
  snapshot: collectWorkflowSnapshot,
};
