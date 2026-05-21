import { bus } from '../../modules/events/EventBus.js';

export function mountDocumentsEventHandlers() {
  const offUploaded = bus.on('document.uploaded', () => {
    bus.emit('notification.created', { message: 'Documento enviado para analise.', icon: '↑' });
  });

  return () => offUploaded?.();
}
