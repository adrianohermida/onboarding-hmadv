import { bus } from '../modules/events/EventBus.js';
import { listWorkspaceOsDomainEntities } from './WorkspaceOSDomainModel.js';
import { commandCenterEngine } from './command-center/CommandCenterEngine.js';
import { universalSearchEngine } from './search/UniversalSearchEngine.js';
import { contextEngine } from './context/ContextEngine.js';
import { copilotWorkspaceEngine } from './copilot/CopilotWorkspaceEngine.js';
import { activityStreamEngine } from './activities/ActivityStreamEngine.js';
import { multiPanelWorkspaceEngine } from './panels/MultiPanelWorkspaceEngine.js';
import { workspaceRuntimeEngine } from './workspace/WorkspaceRuntimeEngine.js';
import { smartNavigationEngine } from './navigation/SmartNavigationEngine.js';
import { contextualActionsEngine } from './actions/ContextualActionsEngine.js';
import { keyboardShortcutEngine } from './shortcuts/KeyboardShortcutEngine.js';
import { workspaceAssistantEngine } from './assistant/WorkspaceAssistantEngine.js';
import { notificationCenterV2Engine } from './notifications/NotificationCenterV2Engine.js';
import { globalActivityFeedEngine } from './streams/GlobalActivityFeedEngine.js';
import { inspectorPanelEngine } from './inspector/InspectorPanelEngine.js';
import { quickActionsEngine } from './quick-actions/QuickActionsEngine.js';
import { floatingDockEngine } from './dock/FloatingDockEngine.js';
import { mobileWorkspaceRuntime } from './mobile/MobileWorkspaceRuntime.js';
import { workspaceAnalyticsEngine } from './analytics/WorkspaceAnalyticsEngine.js';
import { workspaceTelemetryEngine } from './telemetry/WorkspaceTelemetryEngine.js';
import { workspaceGovernanceEngine } from './governance/WorkspaceGovernanceEngine.js';

let mounted = false;
let offs = [];

function trace(category, name, payload = {}, envelope = {}) {
  workspaceTelemetryEngine.track({
    tenant_id: envelope.tenant_id || payload.tenant_id || 'hmadv',
    category,
    name,
    value: Number(payload.value) || 1,
    failed: payload.failed === true,
    degraded: payload.degraded === true,
    trace_id: envelope.trace_id || envelope.correlation_id || null,
  });
}

export function mountWorkspaceOSFoundation() {
  if (mounted) return;
  mounted = true;
  keyboardShortcutEngine.mount();

  offs = [
    bus.on('shell.ready', (payload, envelope) => {
      trace('workspace', 'shell.ready', payload, envelope);
      smartNavigationEngine.navigate({ key: 'dashboard', title: 'Dashboard', href: 'pages/dashboard.html' });
    }),
    bus.on('workspace.command-center.toggle', (payload, envelope) => {
      commandCenterEngine.execute({ tenant_id: payload?.tenant_id, key: 'command.center.toggle', category: 'navigation', source: payload?.source || 'shortcut', trace_id: envelope.trace_id || envelope.correlation_id || null });
      trace('navigation', 'workspace.command-center.toggle', payload, envelope);
    }),
    bus.on('workflow.executed', (payload, envelope) => {
      activityStreamEngine.record({ tenant_id: payload.tenant_id, type: 'workflow', title: 'Workflow executado', trace_id: envelope.trace_id || envelope.correlation_id || null });
      trace('workspace', 'workflow.executed', payload, envelope);
    }),
    bus.on('document.uploaded', (payload, envelope) => {
      activityStreamEngine.record({ tenant_id: payload.tenant_id, type: 'upload', title: 'Documento enviado', trace_id: envelope.trace_id || envelope.correlation_id || null });
      trace('workspace', 'document.uploaded', payload, envelope);
    }),
    bus.on('onboarding.progressed', (payload, envelope) => {
      activityStreamEngine.record({ tenant_id: payload.tenant_id, type: 'onboarding', title: 'Onboarding atualizado', trace_id: envelope.trace_id || envelope.correlation_id || null });
      trace('workspace', 'onboarding.progressed', payload, envelope);
    }),
    bus.on('ui.command.executed', (payload, envelope) => {
      commandCenterEngine.execute({ ...payload, category: payload?.category || 'quick-action', trace_id: envelope.trace_id || envelope.correlation_id || null });
      trace('quick-action', 'ui.command.executed', payload, envelope);
    }),
  ];
}

export function unmountWorkspaceOSFoundation() {
  offs.forEach((off) => {
    try { off(); } catch (_) {}
  });
  offs = [];
  keyboardShortcutEngine.unmount();
  mounted = false;
}

export function collectWorkspaceOSSnapshot(tenant_id = 'hmadv') {
  const commandCenter = commandCenterEngine.snapshot(tenant_id);
  const activities = activityStreamEngine.snapshot(tenant_id);
  const telemetry = workspaceTelemetryEngine.snapshot(tenant_id);
  const navigation = smartNavigationEngine.snapshot();

  const runtime = workspaceRuntimeEngine.update({
    tabs: navigation.recent_items.slice(0, 6),
    history: navigation.history.slice(0, 50),
    current_context: contextEngine.snapshot(),
    copilot_state: 'ready',
  });

  return {
    domain_entities: listWorkspaceOsDomainEntities(),
    copilot: copilotWorkspaceEngine.suggest({ tenant_id, context_type: 'workspace' }),
    command_center: commandCenter,
    search: universalSearchEngine.snapshot(tenant_id),
    activities,
    panels: multiPanelWorkspaceEngine.snapshot({ panels: ['table', 'preview', 'inspector'] }),
    workspace: runtime,
    context: contextEngine.snapshot(),
    navigation,
    actions: contextualActionsEngine.suggest({ tenant_id }),
    shortcuts: keyboardShortcutEngine.snapshot(),
    assistant: workspaceAssistantEngine.summarize({ tenant_id }),
    notifications: notificationCenterV2Engine.snapshot({ items: [] }),
    streams: globalActivityFeedEngine.snapshot(activities),
    inspector: inspectorPanelEngine.snapshot(),
    quick_actions: quickActionsEngine.snapshot(),
    dock: floatingDockEngine.snapshot(),
    mobile: mobileWorkspaceRuntime.snapshot(),
    analytics: workspaceAnalyticsEngine.snapshot({
      command_center_usage: commandCenter.total,
      quick_actions_usage: commandCenter.quick_actions,
      copilot_usage: commandCenter.copilot,
      navigation_time_ms: telemetry.navigation * 120,
      productivity_score: Math.max(0, 100 - ((telemetry.failed + telemetry.degraded) * 2)),
      operational_abandonment: telemetry.failed,
    }),
    telemetry,
    observability: {
      navigation_bottlenecks: telemetry.navigation > 300 ? 1 : 0,
      search_latency: telemetry.search > 250 ? 1 : 0,
      drawer_failures: telemetry.list.filter((item) => item.name === 'workspace.drawer.failed').length,
      modal_failures: telemetry.list.filter((item) => item.name === 'workspace.modal.failed').length,
      hydration_failures: telemetry.list.filter((item) => item.name === 'workspace.hydration.failed').length,
      context_failures: telemetry.list.filter((item) => item.name === 'workspace.context.failed').length,
    },
    governance: workspaceGovernanceEngine.evaluate({}),
    generated_at: new Date().toISOString(),
  };
}

export const workspaceOsFoundation = {
  mount: mountWorkspaceOSFoundation,
  unmount: unmountWorkspaceOSFoundation,
  snapshot: collectWorkspaceOSSnapshot,
};
