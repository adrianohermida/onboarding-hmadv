import { store } from '../shell/state/ShellStore.js';
import { bus } from '../modules/events/EventBus.js';
import { legalOperationsFoundation } from './LegalOperationsFoundation.js';

let mounted = false;
let offs = [];

function refresh() {
  const snapshot = legalOperationsFoundation.snapshot();
  store.setLegalOperationsSnapshot(snapshot);

  if ((snapshot.monitoring?.critical_cases || 0) > 0) {
    store.addNotification({
      type: 'warn',
      title: 'Casos juridicos criticos',
      message: `Casos criticos ativos: ${snapshot.monitoring.critical_cases}`,
    });
  }

  if ((snapshot.sla?.overdue || 0) > 0) {
    store.addNotification({
      type: 'warn',
      title: 'SLA juridico vencido',
      message: `SLAs vencidos: ${snapshot.sla.overdue}`,
    });
  }
}

export function mountLegalOperationsShellVisibility() {
  if (mounted) return;
  mounted = true;
  refresh();

  offs = [
    bus.on('shell.ready', refresh),
    bus.on('case.created', refresh),
    bus.on('case.transitioned', refresh),
    bus.on('task.updated', refresh),
    bus.on('negotiation.updated', refresh),
    bus.on('agreement.signed', refresh),
    bus.on('sla.breached', refresh),
  ];
}

export function unmountLegalOperationsShellVisibility() {
  offs.forEach((off) => {
    try { off(); } catch (_) {}
  });
  offs = [];
  mounted = false;
}
