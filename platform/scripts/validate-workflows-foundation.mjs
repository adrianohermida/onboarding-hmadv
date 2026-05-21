import { existsSync } from 'node:fs';

const required = [
  'workflow-engine/README.md',
  'workflow-engine/WorkflowAutomationFoundation.js',
  'workflow-engine/ShellWorkflowVisibility.js',
  'workflow-engine/definitions/WorkflowDefinitions.js',
  'workflow-engine/state-machines/cases/CaseLifecycleMachine.js',
  'workflow-engine/rules/AutomationRuleEngine.js',
  'workflow-engine/sla/SlaEngine.js',
  'workflow-engine/human-tasks/HumanTaskEngine.js',
  'workflow-engine/tasks/TaskAssignmentEngine.js',
  'workflow-engine/approvals/ApprovalEngine.js',
  'workflow-engine/escalations/EscalationEngine.js',
  'workflow-engine/timers/WorkflowTimerEngine.js',
  'workflow-engine/schedulers/SchedulerFoundation.js',
  'workflow-engine/queues/WorkflowQueue.js',
  'workflow-engine/executors/WorkflowExecutor.js',
  'workflow-engine/transitions/TransitionEngine.js',
  'workflow-engine/conditions/WorkflowConditions.js',
  'workflow-engine/automations/FinancialMonitoringAutomation.js',
  'workflow-engine/automations/MonthlyFinancialUpdateFlow.js',
  'workflow-engine/timeline/CaseTimelineEngine.js',
  'workflow-engine/telemetry/WorkflowTelemetry.js',
  'workflow-engine/audit/WorkflowAuditTrail.js',
  'workflow-engine/orchestrators/WorkflowProcessOrchestrator.js',
  'workflow-engine/orchestrators/FreshdeskWorkflowOrchestration.js',
  'workflow-engine/docs/workflow-foundation.md',
  'workflow-engine/governance/state-machine-governance.md',
  'shared/contracts/workflows/WorkflowContracts.js',
  'docs/workflows/README.md',
  'docs/workflows/lifecycle.md',
  'docs/workflows/transitions.md',
  'docs/workflows/approvals.md',
  'docs/workflows/automations.md',
  'docs/workflows/slas.md',
  'docs/workflows/escalations.md',
  'governance/workflows/workflow-naming.md',
  'governance/workflows/sla-standards.md',
  'governance/workflows/escalation-standards.md',
  'governance/workflows/automation-standards.md',
  'governance/workflows/audit-standards.md',
  'governance/workflows/ai-workflow-governance.md',
  'governance/workflows/module-requirements.md',
  'admin/workflows/index.html',
  'admin/workflows/tenant.html',
];

const missing = required.filter((item) => !existsSync(item));
if (missing.length) {
  console.error('validate:workflows failed. Missing files:');
  missing.forEach((item) => console.error(`- ${item}`));
  process.exit(1);
}

console.log('validate:workflows passed');
