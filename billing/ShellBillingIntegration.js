import { store } from '../shell/state/ShellStore.js';
import { bus } from '../modules/events/EventBus.js';
import { buildTenantBillingSnapshot } from './BillingFoundation.js';
import { classifyLimitState, buildLimitAlert } from './limits/LimitEngine.js';
import { mountBillingUsageSubscribers } from './events/BillingUsageSubscribers.js';
import { mountBillingTelemetrySubscribers } from './telemetry/BillingTelemetrySubscribers.js';

let mounted = false;
let unsubscribers = [];

function refresh(tenantId = 'hmadv') {
  const snapshot = buildTenantBillingSnapshot(tenantId);
  store.setBillingSnapshot(snapshot);

  Object.entries(snapshot.quotas || {}).forEach(([key, usageItem]) => {
    const state = classifyLimitState(usageItem);
    if (state === 'ok') return;

    const alert = buildLimitAlert(usageItem, key);
    if (!alert) return;

    if (state === 'hard_limit') {
      bus.emit('quota.exceeded', { metric: key, ...alert }, { tenant_id: tenantId });
    }
    if (key === 'storage_mb' && (state === 'soft_limit' || state === 'hard_limit')) {
      bus.emit('storage.limit.reached', { metric: key, ...alert }, { tenant_id: tenantId });
    }

    bus.emit('notification.created', {
      message: alert.message,
      icon: state === 'hard_limit' ? '!' : 'i',
      type: 'billing.limit',
    }, { tenant_id: tenantId });
  });
}

export function mountBillingShellIntegration() {
  if (mounted) return;
  mounted = true;
  mountBillingUsageSubscribers();
  mountBillingTelemetrySubscribers();

  const tenantId = store.get('tenant')?.id || 'hmadv';
  refresh(tenantId);

  unsubscribers = [
    bus.on('tenant.ready', ({ tenant }) => refresh(tenant?.id || 'hmadv')),
    bus.on('subscription.updated', () => refresh(store.get('tenant')?.id || 'hmadv')),
    bus.on('subscription.created', () => refresh(store.get('tenant')?.id || 'hmadv')),
    bus.on('upload.completed', () => refresh(store.get('tenant')?.id || 'hmadv')),
    bus.on('signature.requested', () => refresh(store.get('tenant')?.id || 'hmadv')),
    bus.on('journey.step.completed', () => refresh(store.get('tenant')?.id || 'hmadv')),
  ];
}

export function unmountBillingShellIntegration() {
  unsubscribers.forEach((off) => {
    try { off(); } catch (_) {}
  });
  unsubscribers = [];
  mounted = false;
}
