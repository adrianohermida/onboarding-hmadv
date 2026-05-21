import { bus } from '../../modules/events/EventBus.js';

export function mountCrossModuleSubscribers() {
  const unsubscribers = [];

  unsubscribers.push(bus.on('document.uploaded', (payload, envelope) => {
    bus.emit('dashboard.refresh.requested', {
      source: 'document.uploaded',
      entity_id: payload?.docId || payload?.document_id || null,
    }, { tenant_id: envelope?.tenant_id, correlation_id: envelope?.correlation_id });
  }));

  unsubscribers.push(bus.on('debt.updated', (payload, envelope) => {
    bus.emit('analytics.metric.recorded', {
      metric: 'debt.updated',
      debt_id: payload?.debt?.id || payload?.id || null,
    }, { tenant_id: envelope?.tenant_id, correlation_id: envelope?.correlation_id });
  }));

  unsubscribers.push(bus.on('onboarding.completed', (payload, envelope) => {
    bus.emit('support.ticket.create.requested', {
      source: 'onboarding.completed',
      onboarding_id: payload?.onboarding_id || payload?.entity_id || null,
    }, { tenant_id: envelope?.tenant_id, correlation_id: envelope?.correlation_id });
  }));

  return () => unsubscribers.forEach((off) => off?.());
}
