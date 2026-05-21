import { bus } from '../modules/events/EventBus.js';
import { designTokenEngine } from './tokens/DesignTokenEngine.js';
import { themeEngine } from './themes/ThemeEngine.js';
import { typographySystemEngine } from './typography/TypographySystemEngine.js';
import { adaptiveLayoutEngine } from './layouts/AdaptiveLayoutEngine.js';
import { mobileNavigationEngine } from './navigation/MobileNavigationEngine.js';
import { commandCenterFoundation } from './workspace/command-center/CommandCenterFoundation.js';
import { copilotUiFoundation } from './copilot/CopilotUiFoundation.js';
import { modalEcosystemEngine } from './modals/ModalEcosystemEngine.js';
import { drawerSystemEngine } from './drawers/DrawerSystemEngine.js';
import { tableSystemEngine } from './tables/TableSystemEngine.js';
import { formSystemEngine } from './forms/FormSystemEngine.js';
import { cardSystemEngine } from './cards/CardSystemEngine.js';
import { timelineUiSystem } from './timelines/TimelineUiSystem.js';
import { uiStateEngine } from './states/UiStateEngine.js';
import { feedbackSystemEngine } from './feedback/FeedbackSystemEngine.js';
import { motionSystemEngine } from './animations/MotionSystemEngine.js';
import { mobileFirstFoundation } from './mobile/MobileFirstFoundation.js';
import { gestureEngine } from './gestures/GestureEngine.js';
import { iconSystemEngine } from './icons/IconSystemEngine.js';
import { chartSystemEngine } from './charts/ChartSystemEngine.js';
import { accessibilityFoundation } from './accessibility/AccessibilityFoundation.js';
import { tenantBrandingEngine } from './branding/TenantBrandingEngine.js';
import { uiTelemetryEngine } from './telemetry/UiTelemetryEngine.js';
import { workspaceUxEngine } from './workspace/WorkspaceUxEngine.js';
import { componentRegistryEngine } from './components/ComponentRegistryEngine.js';
import { listUiOsDomainEntities } from './UIOSDomainModel.js';

let mounted = false;
let offs = [];

function trace(category, name, payload = {}, envelope = {}) {
  uiTelemetryEngine.track({
    tenant_id: envelope.tenant_id || payload.tenant_id || 'hmadv',
    category,
    name,
    value: Number(payload.value) || 1,
    failed: payload.failed === true,
    degraded: payload.degraded === true,
    trace_id: envelope.trace_id || envelope.correlation_id || null,
  });
}

export function mountUIOSFoundation() {
  if (mounted) return;
  mounted = true;

  offs = [
    bus.on('shell.ready', (payload, envelope) => {
      trace('render', 'shell.ready', payload, envelope);
    }),
    bus.on('modal.opened', (payload, envelope) => {
      trace('modal', 'modal.opened', payload, envelope);
    }),
    bus.on('slideover.opened', (payload, envelope) => {
      trace('interaction', 'slideover.opened', payload, envelope);
    }),
    bus.on('onboarding.progressed', (payload, envelope) => {
      trace('interaction', 'onboarding.progressed', payload, envelope);
    }),
    bus.on('workflow.executed', (payload, envelope) => {
      commandCenterFoundation.register({
        tenant_id: payload.tenant_id,
        key: 'workflow.open',
        category: 'workflow',
        source: 'system',
        trace_id: envelope.trace_id || envelope.correlation_id || null,
      });
      trace('interaction', 'workflow.executed', payload, envelope);
    }),
    bus.on('ui.command.executed', (payload, envelope) => {
      commandCenterFoundation.register(payload);
      trace('interaction', 'ui.command.executed', payload, envelope);
    }),
  ];
}

export function unmountUIOSFoundation() {
  offs.forEach((off) => {
    try { off(); } catch (_) {}
  });
  offs = [];
  mounted = false;
}

export function collectUIOSSnapshot(tenant_id = 'hmadv') {
  const commands = commandCenterFoundation.snapshot(tenant_id);
  const telemetry = uiTelemetryEngine.snapshot(tenant_id);

  return {
    domain_entities: listUiOsDomainEntities(),
    components: componentRegistryEngine.list(),
    tokens: designTokenEngine.snapshot(),
    theme: themeEngine.snapshot({ mode: 'light' }),
    typography: typographySystemEngine.snapshot(),
    layouts: adaptiveLayoutEngine.snapshot({ active_panels: 2, split_mode: 'primary-secondary' }),
    navigation: mobileNavigationEngine.snapshot({ active_nav_key: 'dashboard' }),
    workspace: workspaceUxEngine.snapshot({ active_workspace: 'operations' }),
    command_center: commands,
    copilot: copilotUiFoundation.snapshot({ active_copilot_context: 'workflow' }),
    modals: modalEcosystemEngine.snapshot({ open_modals: 0 }),
    drawers: drawerSystemEngine.snapshot({ open_drawers: 0 }),
    tables: tableSystemEngine.snapshot({ table_interactions: commands.workflow }),
    forms: formSystemEngine.snapshot({ form_submissions: 0 }),
    cards: cardSystemEngine.snapshot({ rendered_cards: 0 }),
    timelines: timelineUiSystem.snapshot({ timeline_events: 0 }),
    states: uiStateEngine.snapshot({ loading_events: 0, empty_events: 0, error_events: telemetry.failed }),
    feedback: feedbackSystemEngine.snapshot({ feedback_events: 0 }),
    animations: motionSystemEngine.snapshot({ animations_triggered: telemetry.interactions }),
    mobile: mobileFirstFoundation.snapshot({ mobile_render_health: telemetry.failed > 0 ? 'degraded' : 'healthy' }),
    gestures: gestureEngine.snapshot({ gesture_events: telemetry.mobile }),
    icons: iconSystemEngine.snapshot(),
    charts: chartSystemEngine.snapshot({ rendered_charts: 0 }),
    accessibility: accessibilityFoundation.snapshot({ a11y_issues_open: 0 }),
    branding: tenantBrandingEngine.snapshot({ primary: '#1A3A5C', accent: '#F5A623' }),
    telemetry,
    observability: {
      hydration_failures: telemetry.list.filter((entry) => entry.name === 'ui.hydration.failed').length,
      rendering_failures: telemetry.failed,
      mobile_rendering_issues: telemetry.list.filter((entry) => entry.category === 'mobile' && entry.failed).length,
      responsiveness_issues: telemetry.list.filter((entry) => entry.name === 'ui.responsive.issue').length,
      ux_bottlenecks: telemetry.onboarding_friction,
    },
    governance: {
      no_inline_styles: true,
      tokens_required: true,
      responsive_required: true,
      accessibility_required: true,
      tenant_branding_required: true,
      interaction_consistency_required: true,
    },
    generated_at: new Date().toISOString(),
  };
}

export const uiOsFoundation = {
  mount: mountUIOSFoundation,
  unmount: unmountUIOSFoundation,
  snapshot: collectUIOSSnapshot,
};
