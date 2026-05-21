import { bus } from '../../modules/events/EventBus.js';
import { autentiqueAdapter } from '../adapters/AutentiqueAdapter.js';
import { freshdeskAdapter } from '../adapters/FreshdeskAdapter.js';

export function mountSignatureIntegrationOrchestrator() {
  const offSignatureCompleted = bus.on('signature.completed', async (payload, envelope) => {
    const context = {
      tenant_id: envelope?.tenant_id || 'hmadv',
      trace_id: envelope?.trace_id || envelope?.correlation_id || null,
      workflow_id: envelope?.workflow_id || null,
    };

    await autentiqueAdapter.signatureTracking({
      ...context,
      status: 'signed',
      data: payload,
    });

    await freshdeskAdapter.updatePipeline({
      ...context,
      ticket_id: payload?.ticket_id || null,
      pipeline_stage: 'signature_completed',
    });

    bus.emit('workflow.pending.close_requested', {
      reason: 'signature_completed',
      case_id: payload?.case_id || null,
      tenant_id: context.tenant_id,
    }, {
      tenant_id: context.tenant_id,
      trace_id: context.trace_id,
      workflow_id: context.workflow_id,
      source_module: 'integrations.signature_orchestrator',
    });
  });

  const offDocumentRejected = bus.on('document.rejected', async (payload, envelope) => {
    const context = {
      tenant_id: envelope?.tenant_id || 'hmadv',
      trace_id: envelope?.trace_id || envelope?.correlation_id || null,
      workflow_id: envelope?.workflow_id || null,
    };

    await freshdeskAdapter.addPublicNote({
      ...context,
      ticket_id: payload?.ticket_id || null,
      body: payload?.reason || 'Documento rejeitado em fluxo de assinatura.',
    });
  });

  return () => {
    try { offSignatureCompleted(); } catch (_) {}
    try { offDocumentRejected(); } catch (_) {}
  };
}
