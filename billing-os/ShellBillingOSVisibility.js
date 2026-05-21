import { store } from '../shell/state/ShellStore.js';
import { bus } from '../modules/events/EventBus.js';
import { billingOsFoundation } from './BillingOSFoundation.js';

let mounted = false;
let offs = [];

function refresh() {
  const snapshot = billingOsFoundation.snapshot();
  store.setBillingOsSnapshot(snapshot);

  const plan = snapshot.subscriptions?.plan_code || 'starter';
  if (snapshot.observability?.payment_failures > 0) {
    store.addNotification({
      type: 'warn',
      title: 'Falhas de pagamento detectadas',
      message: `Plano ${plan}: revisar metodos de pagamento e webhook Stripe.`,
    });
  }

  if (snapshot.observability?.quota_failures > 0) {
    store.addNotification({
      type: 'warn',
      title: 'Quota excedida',
      message: `Plano ${plan}: tenant com quota excedida.`,
    });
  }
}

export function mountBillingOsShellVisibility() {
  if (mounted) return;
  mounted = true;
  refresh();

  offs = [
    bus.on('shell.ready', refresh),
    bus.on('subscription.created', refresh),
    bus.on('subscription.upgraded', refresh),
    bus.on('subscription.downgraded', refresh),
    bus.on('payment.failed', refresh),
    bus.on('invoice.issued', refresh),
    bus.on('workflow.executed', refresh),
    bus.on('document.uploaded', refresh),
  ];
}

export function unmountBillingOsShellVisibility() {
  offs.forEach((off) => {
    try { off(); } catch (_) {}
  });
  offs = [];
  mounted = false;
}
