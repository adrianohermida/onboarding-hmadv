import { bus } from '../../modules/events/EventBus.js';
import { freshdeskAdapter } from '../adapters/FreshdeskAdapter.js';
import { mountOnboardingIntegrationOrchestrator } from './OnboardingIntegrationOrchestrator.js';
import { mountSignatureIntegrationOrchestrator } from './SignatureIntegrationOrchestrator.js';

let mounted = false;
let offs = [];

export function mountIntegrationOrchestrators() {
  if (mounted) return;
  mounted = true;

  offs = [
    mountOnboardingIntegrationOrchestrator(),
    mountSignatureIntegrationOrchestrator(),
    bus.on('plan.generated', async (payload, envelope) => {
      await freshdeskAdapter.updatePipeline({
        tenant_id: envelope?.tenant_id,
        trace_id: envelope?.trace_id || envelope?.correlation_id,
        workflow_id: envelope?.workflow_id || null,
        ticket_id: payload?.ticket_id || null,
        pipeline_stage: 'plan_generated',
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
