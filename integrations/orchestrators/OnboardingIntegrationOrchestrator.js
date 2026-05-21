import { bus } from '../../modules/events/EventBus.js';
import { freshdeskAdapter } from '../adapters/FreshdeskAdapter.js';
import { resendAdapter } from '../adapters/ResendAdapter.js';

export function mountOnboardingIntegrationOrchestrator() {
  const off = bus.on('onboarding.completed', async (payload, envelope) => {
    const context = {
      tenant_id: envelope?.tenant_id || 'hmadv',
      trace_id: envelope?.trace_id || envelope?.correlation_id || null,
      workflow_id: envelope?.workflow_id || null,
    };

    await freshdeskAdapter.createTicket({
      ...context,
      subject: 'Onboarding concluido',
      description: `Onboarding concluido para tenant ${context.tenant_id}`,
      tags: ['onboarding', 'integration-hub'],
    });

    await resendAdapter.sendOnboardingReminder({
      ...context,
      to: payload?.email || null,
      name: payload?.name || 'Cliente',
    });

    bus.emit('integration.completed', {
      provider: 'freshdesk,resend',
      operation: 'onboarding_orchestration',
      tenant_id: context.tenant_id,
    }, {
      tenant_id: context.tenant_id,
      trace_id: context.trace_id,
      workflow_id: context.workflow_id,
      source_module: 'integrations.onboarding_orchestrator',
    });
  });

  return () => {
    try { off(); } catch (_) {}
  };
}
