import { store } from '../shell/state/ShellStore.js';
import { bus } from '../modules/events/EventBus.js';
import { workspaceOsFoundation } from './WorkspaceOSFoundation.js';

let mounted = false;
let offs = [];

function refresh() {
  const snapshot = workspaceOsFoundation.snapshot();
  store.setWorkspaceOsSnapshot(snapshot);

  if ((snapshot.observability?.context_failures || 0) > 0) {
    store.addNotification({
      type: 'warn',
      title: 'Falhas de contexto operacional',
      message: `Ocorrencias detectadas: ${snapshot.observability.context_failures}`,
    });
  }

  if ((snapshot.observability?.navigation_bottlenecks || 0) > 0) {
    store.addNotification({
      type: 'warn',
      title: 'Bottleneck de navegacao',
      message: 'A navegação contextual detectou gargalos operacionais.',
    });
  }
}

export function mountWorkspaceOsShellVisibility() {
  if (mounted) return;
  mounted = true;
  refresh();

  offs = [
    bus.on('shell.ready', refresh),
    bus.on('workspace.command-center.toggle', refresh),
    bus.on('workflow.executed', refresh),
    bus.on('document.uploaded', refresh),
    bus.on('onboarding.progressed', refresh),
    bus.on('ui.command.executed', refresh),
  ];
}

export function unmountWorkspaceOsShellVisibility() {
  offs.forEach((off) => {
    try { off(); } catch (_) {}
  });
  offs = [];
  mounted = false;
}
