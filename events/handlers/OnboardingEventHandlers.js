import { bus } from '../../modules/events/EventBus.js';

export function mountOnboardingEventHandlers() {
  const offStarted = bus.on('onboarding.started', (payload) => {
    bus.emit('notification.created', {
      message: 'Onboarding iniciado.',
      icon: 'i',
      entity_id: payload?.entity_id || null,
    });
  });

  return () => offStarted?.();
}
