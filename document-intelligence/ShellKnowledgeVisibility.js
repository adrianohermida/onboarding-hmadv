import { store } from '../shell/state/ShellStore.js';
import { bus } from '../modules/events/EventBus.js';
import { documentIntelligenceFoundation } from './DocumentIntelligenceFoundation.js';

let mounted = false;
let offs = [];

function refresh() {
  const snapshot = documentIntelligenceFoundation.snapshot();
  store.setKnowledgeSnapshot(snapshot);

  const onboardingProgress = snapshot.knowledge?.journey?.completed || 0;
  if (onboardingProgress > 0) {
    store.addNotification({
      type: 'info',
      title: 'Progresso de conhecimento atualizado',
      message: `Jornadas concluidas: ${onboardingProgress}`,
    });
  }
}

export function mountKnowledgeShellVisibility() {
  if (mounted) return;
  mounted = true;
  refresh();

  offs = [
    bus.on('shell.ready', refresh),
    bus.on('document.created', refresh),
    bus.on('document.uploaded', refresh),
    bus.on('document.approved', refresh),
    bus.on('signature.completed', refresh),
    bus.on('knowledge.video.watched', refresh),
    bus.on('knowledge.onboarding.progress', refresh),
  ];
}

export function unmountKnowledgeShellVisibility() {
  offs.forEach((off) => {
    try { off(); } catch (_) {}
  });
  offs = [];
  mounted = false;
}
