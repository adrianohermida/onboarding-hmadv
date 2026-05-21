import { store } from '../shell/state/ShellStore.js';
import { bus } from '../modules/events/EventBus.js';
import { complianceOsFoundation } from './ComplianceOSFoundation.js';

let mounted = false;
let offs = [];

function refresh() {
  const snapshot = complianceOsFoundation.snapshot();
  store.setComplianceSnapshot(snapshot);

  if ((snapshot.incidents?.open || 0) > 0) {
    store.addNotification({
      type: 'warn',
      title: 'Incidentes de compliance ativos',
      message: `Incidentes abertos: ${snapshot.incidents.open}`,
    });
  }

  if ((snapshot.monitoring?.suspicious_access || 0) > 0) {
    store.addNotification({
      type: 'warn',
      title: 'Acesso sensivel suspeito',
      message: `Acessos suspeitos detectados: ${snapshot.monitoring.suspicious_access}`,
    });
  }
}

export function mountComplianceShellVisibility() {
  if (mounted) return;
  mounted = true;
  refresh();

  offs = [
    bus.on('shell.ready', refresh),
    bus.on('consent.updated', refresh),
    bus.on('resource.accessed', refresh),
    bus.on('security.incident.detected', refresh),
    bus.on('document.uploaded', refresh),
    bus.on('financial.updated.monthly', refresh),
  ];
}

export function unmountComplianceShellVisibility() {
  offs.forEach((off) => {
    try { off(); } catch (_) {}
  });
  offs = [];
  mounted = false;
}
