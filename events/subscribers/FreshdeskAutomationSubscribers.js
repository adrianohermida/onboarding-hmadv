import { bus } from '../../modules/events/EventBus.js';

export function mountFreshdeskAutomationSubscribers() {
  const offOnboarding = bus.on('onboarding.completed', (payload, envelope) => {
    bus.emit('support.ticket.create.requested', {
      type: 'onboarding-completed',
      onboarding_id: payload?.onboarding_id || payload?.entity_id || null,
    }, { tenant_id: envelope?.tenant_id, correlation_id: envelope?.correlation_id });
  });

  const offRejected = bus.on('document.rejected', (payload, envelope) => {
    bus.emit('support.ticket.note.appended', {
      type: 'document-rejected',
      document_id: payload?.docId || payload?.document_id || null,
      reason: payload?.reason || null,
    }, { tenant_id: envelope?.tenant_id, correlation_id: envelope?.correlation_id });
  });

  const offPlan = bus.on('plan.generated', (payload, envelope) => {
    bus.emit('support.pipeline.updated', {
      type: 'plan-generated',
      plan_id: payload?.plan_id || null,
    }, { tenant_id: envelope?.tenant_id, correlation_id: envelope?.correlation_id });
  });

  return () => {
    offOnboarding?.();
    offRejected?.();
    offPlan?.();
  };
}
