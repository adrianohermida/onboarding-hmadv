import { bus } from '../../modules/events/EventBus.js';
import { recordUsage } from '../usage/UsageTracker.js';

let mounted = false;
let unsubscribers = [];

function track(tenantId, metricKey, amount = 1) {
  recordUsage(tenantId || 'hmadv', metricKey, amount);
}

export function mountBillingUsageSubscribers() {
  if (mounted) return;
  mounted = true;

  unsubscribers = [
    bus.on('upload.completed', (_payload, envelope) => track(envelope?.tenant_id, 'monthly_uploads', 1)),
    bus.on('document.uploaded', (_payload, envelope) => {
      track(envelope?.tenant_id, 'monthly_uploads', 1);
      track(envelope?.tenant_id, 'storage_mb', 1);
    }),
    bus.on('signature.requested', (_payload, envelope) => track(envelope?.tenant_id, 'monthly_signatures', 1)),
    bus.on('journey.step.completed', (_payload, envelope) => track(envelope?.tenant_id, 'monthly_workflows', 1)),
    bus.on('notification.created', (_payload, envelope) => track(envelope?.tenant_id, 'monthly_emails', 1)),
    bus.on('financial.saved', (_payload, envelope) => track(envelope?.tenant_id, 'monthly_api_requests', 1)),
  ];
}

export function unmountBillingUsageSubscribers() {
  unsubscribers.forEach((off) => {
    try { off(); } catch (_) {}
  });
  unsubscribers = [];
  mounted = false;
}
