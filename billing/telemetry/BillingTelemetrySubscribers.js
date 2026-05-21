import { bus } from '../../modules/events/EventBus.js';
import { billingTelemetry } from './BillingTelemetry.js';

let mounted = false;
let unsubscribers = [];

export function mountBillingTelemetrySubscribers() {
  if (mounted) return;
  mounted = true;

  const track = (type) => (_payload, envelope) => {
    billingTelemetry.record(type, {
      tenant_id: envelope?.tenant_id || 'hmadv',
      correlation_id: envelope?.correlation_id || null,
      request_id: envelope?.request_id || null,
    });
  };

  unsubscribers = [
    bus.on('quota.exceeded', track('quota_violation')),
    bus.on('storage.limit.reached', track('high_consumption')),
    bus.on('invoice.generated', track('invoice_generated')),
    bus.on('payment.received', track('payment_received')),
    bus.on('payment.failed', track('payment_failed')),
    bus.on('invoice.failed', track('invoice_failed')),
  ];
}

export function unmountBillingTelemetrySubscribers() {
  unsubscribers.forEach((off) => {
    try { off(); } catch (_) {}
  });
  unsubscribers = [];
  mounted = false;
}
