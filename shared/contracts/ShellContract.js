/**
 * ShellContract — the ONLY way modules communicate with the shell.
 *
 * Modules MUST NOT import shell internals directly.
 * All shell interaction goes through these contracts.
 *
 * This decoupling means:
 * - Shell internals can change without breaking modules
 * - Modules are testable in isolation
 * - Future: server-rendered or native shell can swap out
 */
import { globalModal } from '../../shell/modals/GlobalModalRoot.js';
import { globalSlideover } from '../../shell/slideovers/SlideoverRoot.js';
import { store } from '../../shell/state/ShellStore.js';
import { loadingLayer } from '../../shell/layout/GlobalLoadingLayer.js';
import { obs } from '../../shell/observability/Observability.js';
import { bus } from '../../modules/events/EventBus.js';
import { observabilityFoundation } from '../../observability/ObservabilityFoundation.js';
import { integrationHub } from '../../integrations/IntegrationHub.js';
import { workflowAutomationFoundation } from '../../workflow-engine/WorkflowAutomationFoundation.js';
import { documentIntelligenceFoundation } from '../../document-intelligence/DocumentIntelligenceFoundation.js';
import { financialIntelligenceFoundation } from '../../financial-intelligence/FinancialIntelligenceFoundation.js';
import { legalOperationsFoundation } from '../../legal-operations/LegalOperationsFoundation.js';
import { clientExperienceFoundation } from '../../client-experience/ClientExperienceFoundation.js';

// ── Modal API ─────────────────────────────────────────────────────────────────
export const modal = {
  open: (opts) => globalModal.open(opts),
  close: (id) => globalModal.close(id),
  closeAll: () => globalModal.closeAll(),
};

// ── Slideover API ─────────────────────────────────────────────────────────────
export const slideover = {
  open: (opts) => globalSlideover.open(opts),
  close: (id) => globalSlideover.close(id),
  closeAll: () => globalSlideover.closeAll(),
};

// ── Loading API ───────────────────────────────────────────────────────────────
export const loading = {
  start: () => loadingLayer.start(),
  finish: () => loadingLayer.finish(),
  error: () => loadingLayer.error(),
};

// ── Auth API (read-only for modules) ─────────────────────────────────────────
export const auth = {
  getUser: () => store.get('auth')?.user || null,
  isAdmin: () => store.get('auth')?.isAdmin || false,
  isLoaded: () => store.get('auth')?.loaded || false,
  getViewMode: () => store.getViewMode(),
  setViewMode: (mode) => store.setViewMode(mode),
};

// ── Notifications API ─────────────────────────────────────────────────────────
export const notify = {
  push: (item) => store.addNotification(item),
};

// ── Events API ────────────────────────────────────────────────────────────────
export const events = {
  emit: (name, data) => bus.emit(name, data),
  on: (name, handler) => bus.on(name, handler),
  off: (name, handler) => bus.off(name, handler),
};

// ── Observability API ─────────────────────────────────────────────────────────
export const telemetry = {
  log: (event, data) => obs._log(event, data),
  error: (msg, ctx) => obs.error(msg, ctx),
};

export const observability = {
  snapshot: () => observabilityFoundation.collectOperationalSnapshot(),
  metrics: () => observabilityFoundation.telemetryEngine,
  health: () => observabilityFoundation.healthEngine.snapshot(),
  diagnostics: () => observabilityFoundation.runtimeDiagnostics.run(),
};

// ── Integrations API ──────────────────────────────────────────────────────────
export const integrations = {
  getSnapshot: () => store.get('integrations') || {},
  getHealth: () => store.get('integrations')?.health || {},
  getTelemetry: () => store.get('integrations')?.telemetry || {},
  getProviders: () => store.get('integrations')?.providers || [],
  getQueueDepth: () => store.get('integrations')?.queue_depth || 0,
  refresh: () => integrationHub.snapshot(),
};

// ── Workflows API ───────────────────────────────────────────────────────────
export const workflows = {
  getSnapshot: () => store.get('workflows') || {},
  getLifecycle: () => store.get('workflows')?.lifecycle || {},
  getTelemetry: () => store.get('workflows')?.telemetry || {},
  getSla: () => store.get('workflows')?.sla || {},
  getTasks: () => store.get('workflows')?.tasks || {},
  getApprovals: () => store.get('workflows')?.approvals || {},
  getEscalations: () => store.get('workflows')?.escalations || {},
  refresh: () => workflowAutomationFoundation.snapshot(),
};

// ── Knowledge API ───────────────────────────────────────────────────────────
export const knowledge = {
  getSnapshot: () => store.get('knowledge') || {},
  getLifecycle: () => store.get('knowledge')?.lifecycle || {},
  getMetadata: () => store.get('knowledge')?.metadata || {},
  getTelemetry: () => store.get('knowledge')?.knowledge?.telemetry || {},
  getTimeline: () => store.get('knowledge')?.timeline || {},
  getRecentDocuments: () => (store.get('knowledge')?.metadata?.list || []).slice(0, 5),
  getKnowledgeCards: () => store.get('knowledge')?.knowledge?.domains || [],
  getOnboardingProgress: () => store.get('knowledge')?.knowledge?.journey || {},
  refresh: () => documentIntelligenceFoundation.snapshot(),
};

// ── Financial API ───────────────────────────────────────────────────────────
export const financial = {
  getSnapshot: () => store.get('financial') || {},
  getCommitment: () => store.get('financial')?.commitment || {},
  getDiagnosis: () => store.get('financial')?.diagnosis || {},
  getAlerts: () => store.get('financial')?.alerts || { total: 0, alerts: [] },
  getTelemetry: () => store.get('financial')?.telemetry || {},
  getTimeline: () => store.get('financial')?.timeline || { total: 0, list: [] },
  getScore: () => store.get('financial')?.diagnosis?.score || {},
  refresh: () => financialIntelligenceFoundation.snapshot(),
};

// ── Legal Operations API ───────────────────────────────────────────────────
export const legalOperations = {
  getSnapshot: () => store.get('legalOperations') || {},
  getLifecycle: () => store.get('legalOperations')?.lifecycle || {},
  getTimeline: () => store.get('legalOperations')?.timeline || { total: 0, list: [] },
  getSla: () => store.get('legalOperations')?.sla || {},
  getRisk: () => store.get('legalOperations')?.risk || {},
  getProductivity: () => store.get('legalOperations')?.productivity || {},
  getMonitoring: () => store.get('legalOperations')?.monitoring || {},
  getTelemetry: () => store.get('legalOperations')?.telemetry || {},
  refresh: () => legalOperationsFoundation.snapshot(),
};

// ── Client Experience API ─────────────────────────────────────────────────
export const clientExperience = {
  getSnapshot: () => store.get('clientExperience') || {},
  getJourneys: () => store.get('clientExperience')?.journeys || { total: 0, list: [] },
  getEngagement: () => store.get('clientExperience')?.engagement || { total: 0, list: [] },
  getNotifications: () => store.get('clientExperience')?.notifications || { total: 0, list: [] },
  getProgress: () => store.get('clientExperience')?.progress || { total: 0, completed: 0, list: [] },
  getRetention: () => store.get('clientExperience')?.retention || { total: 0, high_risk: 0, list: [] },
  getSatisfaction: () => store.get('clientExperience')?.satisfaction || {},
  getObservability: () => store.get('clientExperience')?.observability || {},
  getTelemetry: () => store.get('clientExperience')?.telemetry || {},
  refresh: () => clientExperienceFoundation.snapshot(),
};

// ── Tenant API ────────────────────────────────────────────────────────────────
export const tenant = {
  getId: () => store.get('tenant')?.id || 'hmadv',
  getName: () => store.get('tenant')?.name || '',
  getBranding: () => store.get('tenant')?.branding || {},
};

// ── Store API (limited surface) ───────────────────────────────────────────────
export const shellStore = {
  subscribe: (slice, handler) => store.subscribe(slice, handler),
};

// ── Billing API (read-only for modules) ─────────────────────────────────────
export const billing = {
  getSnapshot: () => store.get('billing') || {},
  getUsage: () => store.get('billing')?.usage || {},
  getQuotas: () => store.get('billing')?.quotas || {},
  getSubscription: () => store.get('billing')?.subscription || null,
  isFeatureEnabled: (featureKey) => !!store.get('billing')?.entitlements?.features?.[featureKey],
};

// Convenience default export (barrel)
export default { modal, slideover, loading, auth, notify, events, telemetry, observability, integrations, workflows, knowledge, financial, legalOperations, clientExperience, tenant, shellStore, billing };
