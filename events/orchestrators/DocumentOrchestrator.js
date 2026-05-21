import { bus } from '../../modules/events/EventBus.js';

export function mountDocumentOrchestrator() {
  const unsubscribers = [];

  unsubscribers.push(bus.on('document.uploaded', (payload, envelope) => {
    bus.emit('notification.created', {
      channel: 'in-app',
      message: 'Documento recebido e em analise.',
      severity: 'info',
      entity_id: payload?.docId || payload?.document_id || null,
    }, {
      tenant_id: envelope?.tenant_id,
      correlation_id: envelope?.correlation_id,
    });
  }));

  unsubscribers.push(bus.on('document.rejected', (payload, envelope) => {
    bus.emit('support.ticket.note.appended', {
      reason: payload?.reason || 'document rejected',
      document_id: payload?.docId || payload?.document_id || null,
    }, {
      tenant_id: envelope?.tenant_id,
      correlation_id: envelope?.correlation_id,
    });
  }));

  return () => unsubscribers.forEach((off) => off?.());
}
