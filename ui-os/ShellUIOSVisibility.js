import { store } from '../shell/state/ShellStore.js';
import { bus } from '../modules/events/EventBus.js';
import { uiOsFoundation } from './UIOSFoundation.js';

let mounted = false;
let offs = [];

function refresh() {
  const snapshot = uiOsFoundation.snapshot();
  store.setUiOsSnapshot(snapshot);

  if ((snapshot.observability?.rendering_failures || 0) > 0) {
    store.addNotification({
      type: 'warn',
      title: 'Falhas de renderizacao UI',
      message: `Falhas detectadas: ${snapshot.observability.rendering_failures}`,
    });
  }

  if ((snapshot.observability?.responsiveness_issues || 0) > 0) {
    store.addNotification({
      type: 'warn',
      title: 'Problemas de responsividade',
      message: 'A plataforma detectou friccao responsiva e aplicou monitoramento reforcado.',
    });
  }
}

export function mountUiOsShellVisibility() {
  if (mounted) return;
  mounted = true;
  refresh();

  offs = [
    bus.on('shell.ready', refresh),
    bus.on('modal.opened', refresh),
    bus.on('slideover.opened', refresh),
    bus.on('workflow.executed', refresh),
    bus.on('onboarding.progressed', refresh),
    bus.on('ui.command.executed', refresh),
  ];
}

export function unmountUiOsShellVisibility() {
  offs.forEach((off) => {
    try { off(); } catch (_) {}
  });
  offs = [];
  mounted = false;
}
