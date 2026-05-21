import { bus } from '../../modules/events/EventBus.js';
import { freshdeskAdapter } from '../adapters/FreshdeskAdapter.js';
import { resendAdapter } from '../adapters/ResendAdapter.js';
import { autentiqueAdapter } from '../adapters/AutentiqueAdapter.js';
import { runDocumentWorkflowIntegration } from '../workflows/DocumentWorkflowIntegrations.js';

let mounted = false;
let offs = [];

export function mountIntegrationOrchestrators() {
  if (mounted) return;
  mounted = true;

  offs = [
    bus.on('onboarding.completed', async (payload, envelope) => {
      await freshdeskAdapter.createTicket({
        tenant_id: envelope?.tenant_id,
        trace_id: envelope?.trace_id || envelope?.correlation_id,
        workflow_id: envelope?.workflow_id || null,
        subject: 'Onboarding concluido',
        description: `Onboarding concluido para tenant ${envelope?.tenant_id || 'hmadv'}`,
        tags: ['onboarding', 'automation'],
      });
      await resendAdapter.sendOnboardingReminder({
        tenant_id: envelope?.tenant_id,
        trace_id: envelope?.trace_id || envelope?.correlation_id,
        workflow_id: envelope?.workflow_id || null,
        to: payload?.email || null,
        name: payload?.name || 'Cliente',
      });
    }),
    bus.on('document.rejected', async (payload, envelope) => {
      await freshdeskAdapter.addPublicNote({
        tenant_id: envelope?.tenant_id,
        trace_id: envelope?.trace_id || envelope?.correlation_id,
        workflow_id: envelope?.workflow_id || null,
        ticket_id: payload?.ticket_id || null,
        body: payload?.reason || 'Documento rejeitado no workflow.',
      });
    }),
    bus.on('plan.generated', async (payload, envelope) => {
      await freshdeskAdapter.updatePipeline({
        tenant_id: envelope?.tenant_id,
        trace_id: envelope?.trace_id || envelope?.correlation_id,
        workflow_id: envelope?.workflow_id || null,
        ticket_id: payload?.ticket_id || null,
        pipeline_stage: 'plan_generated',
      });
    }),
    bus.on('signature.completed', async (payload, envelope) => {
      await autentiqueAdapter.signatureTracking({
        tenant_id: envelope?.tenant_id,
        trace_id: envelope?.trace_id || envelope?.correlation_id,
        workflow_id: envelope?.workflow_id || null,
        status: 'signed',
        data: payload,
      });
      await runDocumentWorkflowIntegration({
        tenant_id: envelope?.tenant_id,
        trace_id: envelope?.trace_id || envelope?.correlation_id,
        workflow_id: envelope?.workflow_id || null,
        data: payload,
      });
    }),
  ];
}

export function unmountIntegrationOrchestrators() {
  offs.forEach((off) => {
    try { off(); } catch (_) {}
  });
  offs = [];
  mounted = false;
}
