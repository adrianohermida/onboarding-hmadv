import { bus } from '../../modules/events/EventBus.js';
import { caseLifecycleMachine } from '../state-machines/cases/CaseLifecycleMachine.js';
import { caseTimelineEngine } from '../timeline/CaseTimelineEngine.js';
import { automationRuleEngine } from '../rules/AutomationRuleEngine.js';
import { slaEngine } from '../sla/SlaEngine.js';
import { assignTask } from '../tasks/TaskAssignmentEngine.js';
import { approvalEngine } from '../approvals/ApprovalEngine.js';
import { escalationEngine } from '../escalations/EscalationEngine.js';

let mounted = false;
let offs = [];

function trackTimeline(case_id, event, envelope, details = {}) {
  caseTimelineEngine.add({
    case_id,
    event,
    tenant_id: envelope?.tenant_id || 'hmadv',
    workflow_id: envelope?.workflow_id || null,
    trace_id: envelope?.trace_id || envelope?.correlation_id || null,
    details,
  });
}

export function mountWorkflowProcessOrchestrator() {
  if (mounted) return;
  mounted = true;

  automationRuleEngine.register({
    id: 'document.rejected.notify_and_task',
    trigger: 'document.rejected',
    condition: () => true,
    action: async (ctx) => {
      bus.emit('notification.created', {
        title: 'Documento rejeitado',
        message: 'Reenvio necessario para continuar o onboarding.',
        level: 'warn',
      }, {
        tenant_id: ctx.tenant_id,
        workflow_id: ctx.workflow_id,
        trace_id: ctx.trace_id,
      });

      const task = assignTask({
        type: 'review',
        title: 'Revisar documento rejeitado',
        owner: 'onboarding',
        responsible: 'support',
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        sla: 'document_review',
        tenant_id: ctx.tenant_id,
        workflow_id: ctx.workflow_id,
      });

      const approval = approvalEngine.requestApproval({
        type: 'document_approval',
        tenant_id: ctx.tenant_id,
        workflow_id: ctx.workflow_id,
        owner: 'documents',
      });

      return { task, approval };
    },
  });

  offs = [
    bus.on('onboarding.started', (payload, envelope) => {
      const case_id = payload?.case_id || payload?.id || envelope?.entity_id || `case_${Date.now()}`;
      caseLifecycleMachine.start(case_id, { tenant_id: envelope?.tenant_id || 'hmadv' });
      caseLifecycleMachine.transition(case_id, 'invited', {
        tenant_id: envelope?.tenant_id || 'hmadv',
        actor: envelope?.actor_id || 'system',
        workflow_id: envelope?.workflow_id || null,
        trace_id: envelope?.trace_id || envelope?.correlation_id || null,
      });
      caseLifecycleMachine.transition(case_id, 'onboarding_started', {
        tenant_id: envelope?.tenant_id || 'hmadv',
        actor: envelope?.actor_id || 'system',
        workflow_id: envelope?.workflow_id || null,
        trace_id: envelope?.trace_id || envelope?.correlation_id || null,
      });
      trackTimeline(case_id, 'onboarding.started', envelope);
      slaEngine.track({
        workflow: 'onboarding',
        stage: 'onboarding_review',
        tenant_id: envelope?.tenant_id || 'hmadv',
        deadline_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      });
    }),
    bus.on('onboarding.completed', (payload, envelope) => {
      const case_id = payload?.case_id || payload?.id || envelope?.entity_id;
      if (!case_id) return;
      caseLifecycleMachine.transition(case_id, 'onboarding_approved', {
        tenant_id: envelope?.tenant_id || 'hmadv',
        actor: envelope?.actor_id || 'system',
        workflow_id: envelope?.workflow_id || null,
        trace_id: envelope?.trace_id || envelope?.correlation_id || null,
      });
      trackTimeline(case_id, 'onboarding.completed', envelope);
    }),
    bus.on('document.uploaded', (payload, envelope) => {
      const case_id = payload?.case_id || envelope?.entity_id;
      if (!case_id) return;
      caseLifecycleMachine.transition(case_id, 'documents_pending', {
        tenant_id: envelope?.tenant_id || 'hmadv',
        actor: envelope?.actor_id || 'system',
        workflow_id: envelope?.workflow_id || null,
        trace_id: envelope?.trace_id || envelope?.correlation_id || null,
      });
      trackTimeline(case_id, 'document.uploaded', envelope);
      slaEngine.track({
        workflow: 'documents',
        stage: 'document_review',
        tenant_id: envelope?.tenant_id || 'hmadv',
        deadline_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });
    }),
    bus.on('document.rejected', async (payload, envelope) => {
      const case_id = payload?.case_id || envelope?.entity_id;
      trackTimeline(case_id, 'document.rejected', envelope, { reason: payload?.reason || null });

      await automationRuleEngine.evaluate('document.rejected', {
        case_id,
        tenant_id: envelope?.tenant_id || 'hmadv',
        workflow_id: envelope?.workflow_id || null,
        trace_id: envelope?.trace_id || envelope?.correlation_id || null,
      });

      const escalation = escalationEngine.trigger({
        type: 'document_rejected',
        level: 'manager',
        tenant_id: envelope?.tenant_id || 'hmadv',
        workflow_id: envelope?.workflow_id || null,
        reason: payload?.reason || 'document rejected',
      });

      bus.emit('workflow.escalation.triggered', escalation, {
        tenant_id: envelope?.tenant_id || 'hmadv',
        workflow_id: envelope?.workflow_id || null,
        trace_id: envelope?.trace_id || envelope?.correlation_id || null,
        source_module: 'workflow-engine.process-orchestrator',
      });
    }),
    bus.on('plan.generated', (payload, envelope) => {
      const case_id = payload?.case_id || envelope?.entity_id;
      if (!case_id) return;
      caseLifecycleMachine.transition(case_id, 'plan_generation', {
        tenant_id: envelope?.tenant_id || 'hmadv',
        actor: envelope?.actor_id || 'system',
        workflow_id: envelope?.workflow_id || null,
        trace_id: envelope?.trace_id || envelope?.correlation_id || null,
      });
      trackTimeline(case_id, 'plan.generated', envelope);
      approvalEngine.requestApproval({
        type: 'payment_plan_approval',
        tenant_id: envelope?.tenant_id || 'hmadv',
        workflow_id: envelope?.workflow_id || null,
        owner: 'legal',
      });
    }),
  ];
}

export function unmountWorkflowProcessOrchestrator() {
  offs.forEach((off) => {
    try { off(); } catch (_) {}
  });
  offs = [];
  mounted = false;
}
