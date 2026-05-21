import { store } from '../shell/state/ShellStore.js';
import { bus } from '../modules/events/EventBus.js';
import { clientExperienceFoundation } from './ClientExperienceFoundation.js';

let mounted = false;
let offs = [];

function refresh() {
  const snapshot = clientExperienceFoundation.snapshot();
  store.setClientExperienceSnapshot(snapshot);

  if ((snapshot.retention?.high_risk || 0) > 0) {
    store.addNotification({
      type: 'warn',
      title: 'Clientes com risco de abandono',
      message: `Clientes em risco alto: ${snapshot.retention.high_risk}`,
    });
  }

  if ((snapshot.observability?.upload_friction || 0) > 0) {
    store.addNotification({
      type: 'info',
      title: 'Apoio em uploads disponivel',
      message: 'Detectamos friccao em uploads e reforcamos orientacao acolhedora.',
    });
  }
}

export function mountClientExperienceShellVisibility() {
  if (mounted) return;
  mounted = true;
  refresh();

  offs = [
    bus.on('shell.ready', refresh),
    bus.on('client.journey.updated', refresh),
    bus.on('onboarding.progressed', refresh),
    bus.on('notification.sent', refresh),
    bus.on('feedback.submitted', refresh),
    bus.on('knowledge.video.watched', refresh),
  ];
}

export function unmountClientExperienceShellVisibility() {
  offs.forEach((off) => {
    try { off(); } catch (_) {}
  });
  offs = [];
  mounted = false;
}
