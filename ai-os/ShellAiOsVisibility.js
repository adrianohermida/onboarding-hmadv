import { store } from '../shell/state/ShellStore.js';
import { bus } from '../modules/events/EventBus.js';
import { aiOsFoundation } from './AIOSFoundation.js';

let mounted = false;
let offs = [];

function refresh() {
  const snapshot = aiOsFoundation.snapshot();
  store.setAiOsSnapshot(snapshot);

  if ((snapshot.telemetry?.failures || 0) > 0) {
    store.addNotification({
      type: 'warn',
      title: 'Falhas em assistencia de IA',
      message: `Falhas registradas: ${snapshot.telemetry.failures}`,
    });
  }

  if ((snapshot.human_review?.pending || 0) > 0) {
    store.addNotification({
      type: 'info',
      title: 'Revisoes humanas pendentes',
      message: `Acoes de IA aguardando revisao: ${snapshot.human_review.pending}`,
    });
  }
}

export function mountAiOsShellVisibility() {
  if (mounted) return;
  mounted = true;
  refresh();

  offs = [
    bus.on('shell.ready', refresh),
    bus.on('ai.prompt.executed', refresh),
    bus.on('ai.retrieval.requested', refresh),
    bus.on('ai.action.drafted', refresh),
    bus.on('ai.handoff.requested', refresh),
  ];
}

export function unmountAiOsShellVisibility() {
  offs.forEach((off) => {
    try { off(); } catch (_) {}
  });
  offs = [];
  mounted = false;
}
