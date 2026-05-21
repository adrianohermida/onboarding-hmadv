import { store } from '../shell/state/ShellStore.js';
import { bus } from '../modules/events/EventBus.js';
import { collectIntegrationSnapshot } from './IntegrationHub.js';

let mounted = false;
let offs = [];

function refresh() {
  const snapshot = collectIntegrationSnapshot();
  store.setIntegrationSnapshot(snapshot);

  if (snapshot.health?.global === 'critical') {
    store.addNotification({
      type: 'error',
      title: 'Falha critica em integracoes',
      message: 'Uma ou mais integracoes estao indisponiveis.',
    });
  }

  if ((snapshot.telemetry?.sla_violations || 0) > 0) {
    store.addNotification({
      type: 'warn',
      title: 'SLA de integracoes em risco',
      message: `Violacoes de SLA detectadas: ${snapshot.telemetry.sla_violations}`,
    });
  }

  if ((snapshot.telemetry?.failures || 0) > 0) {
    store.addNotification({
      type: 'warn',
      title: 'Falhas de integracoes detectadas',
      message: `Falhas recentes: ${snapshot.telemetry.failures}`,
    });
  }
}

export function mountIntegrationShellVisibility() {
  if (mounted) return;
  mounted = true;
  refresh();

  offs = [
    bus.on('shell.ready', refresh),
    bus.on('onboarding.completed', refresh),
    bus.on('document.rejected', refresh),
    bus.on('plan.generated', refresh),
    bus.on('signature.completed', refresh),
  ];
}

export function unmountIntegrationShellVisibility() {
  offs.forEach((off) => {
    try { off(); } catch (_) {}
  });
  offs = [];
  mounted = false;
}
