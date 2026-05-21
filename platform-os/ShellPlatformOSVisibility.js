import { store } from '../shell/state/ShellStore.js';
import { bus } from '../modules/events/EventBus.js';
import { platformOsFoundation } from './PlatformOSFoundation.js';

let mounted = false;
let offs = [];

function refresh() {
  const snapshot = platformOsFoundation.snapshot();
  store.setPlatformOsSnapshot(snapshot);

  if ((snapshot.observability?.degraded_runtime || 0) > 0) {
    store.addNotification({
      type: 'warn',
      title: 'Runtime degradado',
      message: 'A plataforma identificou degradacao operacional e reforcou isolamento.',
    });
  }

  if ((snapshot.observability?.deployment_failures || 0) > 0) {
    store.addNotification({
      type: 'warn',
      title: 'Falhas de deployment',
      message: `Falhas recentes: ${snapshot.observability.deployment_failures}`,
    });
  }
}

export function mountPlatformOsShellVisibility() {
  if (mounted) return;
  mounted = true;
  refresh();

  offs = [
    bus.on('shell.ready', refresh),
    bus.on('deployment.completed', refresh),
    bus.on('deployment.failed', refresh),
    bus.on('workflow.executed', refresh),
    bus.on('document.uploaded', refresh),
    bus.on('integration.call.completed', refresh),
    bus.on('feature.flag.updated', refresh),
  ];
}

export function unmountPlatformOsShellVisibility() {
  offs.forEach((off) => {
    try { off(); } catch (_) {}
  });
  offs = [];
  mounted = false;
}
