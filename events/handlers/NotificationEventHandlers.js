import { bus } from '../../modules/events/EventBus.js';

export function mountNotificationEventHandlers() {
  const offCreated = bus.on('notification.created', (payload) => {
    if (!payload?.message) return;
    bus.emit('notification.read', { id: payload?.id || null, auto: false });
  });

  return () => offCreated?.();
}
