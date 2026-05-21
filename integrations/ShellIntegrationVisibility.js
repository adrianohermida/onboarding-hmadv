import { store } from '../shell/state/ShellStore.js';
import { bus } from '../modules/events/EventBus.js';
import { collectIntegrationSnapshot } from './IntegrationHub.js';

let mounted = false;
let offs = [];

function refresh() {
  store.setIntegrationSnapshot(collectIntegrationSnapshot());
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
