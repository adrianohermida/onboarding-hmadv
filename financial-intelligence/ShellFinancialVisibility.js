import { store } from '../shell/state/ShellStore.js';
import { bus } from '../modules/events/EventBus.js';
import { financialIntelligenceFoundation } from './FinancialIntelligenceFoundation.js';

let mounted = false;
let offs = [];

function refresh() {
  const snapshot = financialIntelligenceFoundation.snapshot();
  store.setFinancialSnapshot(snapshot);

  if ((snapshot.alerts?.total || 0) > 0) {
    store.addNotification({
      type: 'warn',
      title: 'Alertas financeiros detectados',
      message: `Alertas ativos: ${snapshot.alerts.total}`,
    });
  }
}

export function mountFinancialShellVisibility() {
  if (mounted) return;
  mounted = true;
  refresh();

  offs = [
    bus.on('shell.ready', refresh),
    bus.on('financial.updated.monthly', refresh),
    bus.on('debt.updated', refresh),
    bus.on('payment.confirmed', refresh),
    bus.on('payment.delayed', refresh),
    bus.on('payment.renegotiated', refresh),
  ];
}

export function unmountFinancialShellVisibility() {
  offs.forEach((off) => {
    try { off(); } catch (_) {}
  });
  offs = [];
  mounted = false;
}
