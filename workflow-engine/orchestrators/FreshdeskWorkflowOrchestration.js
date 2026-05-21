import { bus } from '../../modules/events/EventBus.js';
import { freshdeskAdapter } from '../../integrations/adapters/FreshdeskAdapter.js';

let mounted = false;
let offs = [];

export function mountFreshdeskWorkflowOrchestration() {
  if (mounted) return;
  mounted = true;

  offs = [
    bus.on('onboarding.completed', async (payload, envelope) => {
      await freshdeskAdapter.createTicket({
        tenant_id: envelope?.tenant_id || 'hmadv',
        trace_id: envelope?.trace_id || envelope?.correlation_id || null,
        workflow_id: envelope?.workflow_id || null,
        subject: 'Onboarding concluido',
        description: `Onboarding concluido para caso ${payload?.case_id || 'n/a'}`,
        tags: ['workflow', 'onboarding'],
      });
    }),
    bus.on('document.rejected', async (payload, envelope) => {
      await freshdeskAdapter.addPublicNote({
        tenant_id: envelope?.tenant_id || 'hmadv',
        trace_id: envelope?.trace_id || envelope?.correlation_id || null,
        workflow_id: envelope?.workflow_id || null,
        ticket_id: payload?.ticket_id || null,
        body: payload?.reason || 'Documento rejeitado no fluxo de revisao.',
      });
    }),
    bus.on('plan.generated', async (payload, envelope) => {
      await freshdeskAdapter.updatePipeline({
        tenant_id: envelope?.tenant_id || 'hmadv',
        trace_id: envelope?.trace_id || envelope?.correlation_id || null,
        workflow_id: envelope?.workflow_id || null,
        ticket_id: payload?.ticket_id || null,
        pipeline_stage: 'plan_generated',
      });
    }),
    bus.on('support.requested', async (payload, envelope) => {
      await freshdeskAdapter.createTicket({
        tenant_id: envelope?.tenant_id || 'hmadv',
        trace_id: envelope?.trace_id || envelope?.correlation_id || null,
        workflow_id: envelope?.workflow_id || null,
        subject: payload?.subject || 'Solicitacao de suporte',
        description: payload?.description || 'Atendimento solicitado via workflow.',
        tags: ['workflow', 'support'],
      });
    }),
  ];
}

export function unmountFreshdeskWorkflowOrchestration() {
  offs.forEach((off) => {
    try { off(); } catch (_) {}
  });
  offs = [];
  mounted = false;
}
