import { store } from '../shell/state/ShellStore.js';
import { bus } from '../modules/events/EventBus.js';
import { workflowAutomationFoundation } from './WorkflowAutomationFoundation.js';

let mounted = false;
let offs = [];

function refresh() {
  const snapshot = workflowAutomationFoundation.snapshot();
  store.setWorkflowSnapshot(snapshot);

  if (snapshot.sla?.overdue > 0) {
    store.addNotification({
      type: 'warn',
      title: 'SLA de workflows em risco',
      message: `Workflows com SLA vencido: ${snapshot.sla.overdue}`,
    });
  }

  if (snapshot.tasks?.overdue > 0) {
    store.addNotification({
      type: 'warn',
      title: 'Tarefas vencidas',
      message: `Tarefas pendentes vencidas: ${snapshot.tasks.overdue}`,
    });
  }
}

export function mountWorkflowShellVisibility() {
  if (mounted) return;
  mounted = true;
  refresh();

  offs = [
    bus.on('shell.ready', refresh),
    bus.on('onboarding.started', refresh),
    bus.on('onboarding.completed', refresh),
    bus.on('document.uploaded', refresh),
    bus.on('document.rejected', refresh),
    bus.on('plan.generated', refresh),
    bus.on('workflow.escalation.triggered', refresh),
  ];
}

export function unmountWorkflowShellVisibility() {
  offs.forEach((off) => {
    try { off(); } catch (_) {}
  });
  offs = [];
  mounted = false;
}
