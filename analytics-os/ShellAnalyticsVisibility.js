import { store } from '../shell/state/ShellStore.js';
import { bus } from '../modules/events/EventBus.js';
import { analyticsOsFoundation } from './AnalyticsOSFoundation.js';

let mounted = false;
let offs = [];

function refresh() {
  const snapshot = analyticsOsFoundation.snapshot();
  store.setAnalyticsSnapshot(snapshot);

  if ((snapshot.observability?.missing_metrics || 0) > 0) {
    store.addNotification({
      type: 'warn',
      title: 'Metricas ausentes detectadas',
      message: `Metricas faltantes: ${snapshot.observability.missing_metrics}`,
    });
  }

  if ((snapshot.observability?.analytics_degradation || 0) > 0) {
    store.addNotification({
      type: 'warn',
      title: 'Degradacao em analytics',
      message: `Eventos de degradacao: ${snapshot.observability.analytics_degradation}`,
    });
  }
}

export function mountAnalyticsShellVisibility() {
  if (mounted) return;
  mounted = true;
  refresh();

  offs = [
    bus.on('shell.ready', refresh),
    bus.on('onboarding.progressed', refresh),
    bus.on('document.uploaded', refresh),
    bus.on('workflow.executed', refresh),
    bus.on('financial.updated.monthly', refresh),
    bus.on('analytics.pipeline.run', refresh),
  ];
}

export function unmountAnalyticsShellVisibility() {
  offs.forEach((off) => {
    try { off(); } catch (_) {}
  });
  offs = [];
  mounted = false;
}
