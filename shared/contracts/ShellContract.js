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
import { aiOsFoundation } from '../../ai-os/AIOSFoundation.js';
import { complianceOsFoundation } from '../../compliance-os/ComplianceOSFoundation.js';
import { analyticsOsFoundation } from '../../analytics-os/AnalyticsOSFoundation.js';
<<<<<<< HEAD
import { platformOsFoundation } from '../../platform-os/PlatformOSFoundation.js';
import { uiOsFoundation } from '../../ui-os/UIOSFoundation.js';
import { workspaceOsFoundation } from '../../workspace-os/WorkspaceOSFoundation.js';
import { billingOsFoundation } from '../../billing-os/BillingOSFoundation.js';
=======
>>>>>>> c274e1dce2d6e6ff268d5687f962db62d5191980

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

// ── AI OS API ─────────────────────────────────────────────────────────────
export const aiOs = {
  getSnapshot: () => store.get('aiOs') || {},
  getAgents: () => store.get('aiOs')?.agents || [],
  getCopilot: () => store.get('aiOs')?.copilot || { total: 0, list: [] },
  getRetrieval: () => store.get('aiOs')?.retrieval || { total: 0, list: [] },
  getActions: () => store.get('aiOs')?.actions || { total: 0, list: [] },
  getHumanReview: () => store.get('aiOs')?.human_review || { total: 0, pending: 0, list: [] },
  getTelemetry: () => store.get('aiOs')?.telemetry || {},
  getObservability: () => store.get('aiOs')?.observability || {},
  getAnalytics: () => store.get('aiOs')?.analytics || {},
  refresh: () => aiOsFoundation.snapshot(),
};

// ── Compliance API ────────────────────────────────────────────────────────
export const compliance = {
  getSnapshot: () => store.get('compliance') || {},
  getLgpd: () => store.get('compliance')?.lgpd || {},
  getConsents: () => store.get('compliance')?.consents || { total: 0, accepted: 0, revoked: 0, list: [] },
  getAudit: () => store.get('compliance')?.audit || { total: 0, list: [] },
  getRisk: () => store.get('compliance')?.risk || { total: 0, high: 0, list: [] },
  getAccess: () => store.get('compliance')?.access || { total: 0, suspicious: 0, list: [] },
  getIncidents: () => store.get('compliance')?.incidents || { total: 0, open: 0, list: [] },
  getMonitoring: () => store.get('compliance')?.monitoring || {},
  getTelemetry: () => store.get('compliance')?.telemetry || {},
  getAnalytics: () => store.get('compliance')?.analytics || {},
  refresh: () => complianceOsFoundation.snapshot(),
};

// ── Analytics API ─────────────────────────────────────────────────────────
export const analytics = {
  getSnapshot: () => store.get('analytics') || {},
  getMetrics: () => store.get('analytics')?.metrics || { total: 0, list: [] },
  getKpis: () => store.get('analytics')?.kpis || {},
  getExecutive: () => store.get('analytics')?.executive || {},
  getFinancial: () => store.get('analytics')?.financial || {},
  getLegal: () => store.get('analytics')?.legal || {},
  getOperations: () => store.get('analytics')?.operations || {},
  getOnboarding: () => store.get('analytics')?.onboarding || {},
  getEngagement: () => store.get('analytics')?.engagement || {},
  getProductivity: () => store.get('analytics')?.productivity || {},
  getSla: () => store.get('analytics')?.sla || {},
  getTenants: () => store.get('analytics')?.tenants || {},
  getRisk: () => store.get('analytics')?.risk || {},
  getInsights: () => store.get('analytics')?.insights || {},
  getPredictions: () => store.get('analytics')?.predictions || {},
  getObservability: () => store.get('analytics')?.observability || {},
  getTelemetry: () => store.get('analytics')?.telemetry || {},
  getGovernance: () => store.get('analytics')?.governance || {},
  refresh: () => analyticsOsFoundation.snapshot(),
};

<<<<<<< HEAD
// ── Platform OS API ───────────────────────────────────────────────────────
export const platformOs = {
  getSnapshot: () => store.get('platformOs') || {},
  getRuntime: () => store.get('platformOs')?.runtime || {},
  getDeployments: () => store.get('platformOs')?.deployments || { total: 0, failed: 0, list: [] },
  getScaling: () => store.get('platformOs')?.scaling || {},
  getPerformance: () => store.get('platformOs')?.performance || {},
  getQueues: () => store.get('platformOs')?.queues || { total: 0, queued: 0, processing: 0, failed: 0, dead_letter: 0, throttled: 0, retries: 0, list: [] },
  getWorkers: () => store.get('platformOs')?.workers || { total: 0, online: 0, degraded: 0, failed: 0, retries: 0, isolated: 0, list: [] },
  getResilience: () => store.get('platformOs')?.resilience || {},
  getMonitoring: () => store.get('platformOs')?.monitoring || {},
  getTelemetry: () => store.get('platformOs')?.telemetry || {},
  getAnalytics: () => store.get('platformOs')?.analytics || {},
  getGovernance: () => store.get('platformOs')?.governance || {},
  getObservability: () => store.get('platformOs')?.observability || {},
  refresh: () => platformOsFoundation.snapshot(),
};

// ── UI OS API ─────────────────────────────────────────────────────────────
export const uiOs = {
  getSnapshot: () => store.get('uiOs') || {},
  getTokens: () => store.get('uiOs')?.tokens || {},
  getTheme: () => store.get('uiOs')?.theme || {},
  getTypography: () => store.get('uiOs')?.typography || {},
  getLayouts: () => store.get('uiOs')?.layouts || {},
  getNavigation: () => store.get('uiOs')?.navigation || {},
  getWorkspace: () => store.get('uiOs')?.workspace || {},
  getCommandCenter: () => store.get('uiOs')?.command_center || { total: 0, navigation: 0, workflow: 0, client: 0, list: [] },
  getModals: () => store.get('uiOs')?.modals || {},
  getDrawers: () => store.get('uiOs')?.drawers || {},
  getTables: () => store.get('uiOs')?.tables || {},
  getForms: () => store.get('uiOs')?.forms || {},
  getCards: () => store.get('uiOs')?.cards || {},
  getTimelines: () => store.get('uiOs')?.timelines || {},
  getStates: () => store.get('uiOs')?.states || {},
  getFeedback: () => store.get('uiOs')?.feedback || {},
  getAnimations: () => store.get('uiOs')?.animations || {},
  getMobile: () => store.get('uiOs')?.mobile || {},
  getAccessibility: () => store.get('uiOs')?.accessibility || {},
  getBranding: () => store.get('uiOs')?.branding || {},
  getTelemetry: () => store.get('uiOs')?.telemetry || {},
  getObservability: () => store.get('uiOs')?.observability || {},
  getGovernance: () => store.get('uiOs')?.governance || {},
  refresh: () => uiOsFoundation.snapshot(),
};

// ── Workspace OS API ─────────────────────────────────────────────────────
export const workspaceOs = {
  getSnapshot: () => store.get('workspaceOs') || {},
  getCommandCenter: () => store.get('workspaceOs')?.command_center || { total: 0, navigation: 0, workflow: 0, copilot: 0, quick_actions: 0, list: [] },
  getSearch: () => store.get('workspaceOs')?.search || { total: 0, results: 0, by_type: {}, list: [] },
  getContext: () => store.get('workspaceOs')?.context || {},
  getCopilot: () => store.get('workspaceOs')?.copilot || {},
  getActivities: () => store.get('workspaceOs')?.activities || { total: 0, uploads: 0, onboarding: 0, workflows: 0, approvals: 0, ai_suggestions: 0, list: [] },
  getPanels: () => store.get('workspaceOs')?.panels || {},
  getWorkspace: () => store.get('workspaceOs')?.workspace || {},
  getNavigation: () => store.get('workspaceOs')?.navigation || {},
  getActions: () => store.get('workspaceOs')?.actions || {},
  getShortcuts: () => store.get('workspaceOs')?.shortcuts || {},
  getAssistant: () => store.get('workspaceOs')?.assistant || {},
  getNotifications: () => store.get('workspaceOs')?.notifications || {},
  getStreams: () => store.get('workspaceOs')?.streams || {},
  getInspector: () => store.get('workspaceOs')?.inspector || {},
  getQuickActions: () => store.get('workspaceOs')?.quick_actions || { total: 0, list: [], smart_actions_ready: true },
  getDock: () => store.get('workspaceOs')?.dock || {},
  getMobile: () => store.get('workspaceOs')?.mobile || {},
  getAnalytics: () => store.get('workspaceOs')?.analytics || {},
  getTelemetry: () => store.get('workspaceOs')?.telemetry || {},
  getObservability: () => store.get('workspaceOs')?.observability || {},
  getGovernance: () => store.get('workspaceOs')?.governance || {},
  refresh: () => workspaceOsFoundation.snapshot(),
};

// ── Billing OS API ───────────────────────────────────────────────────────
export const billingOs = {
  getSnapshot: () => store.get('billingOs') || {},
  getPlans: () => store.get('billingOs')?.plans || { current: 'starter', catalog: [] },
  getSubscriptions: () => store.get('billingOs')?.subscriptions || {},
  getCheckout: () => store.get('billingOs')?.checkout || {},
  getCustomers: () => store.get('billingOs')?.customers || {},
  getPayments: () => store.get('billingOs')?.payments || {},
  getInvoices: () => store.get('billingOs')?.invoices || { total: 0, paid: 0, overdue: 0, pending: 0, list: [] },
  getUsage: () => store.get('billingOs')?.usage || {},
  getQuotas: () => store.get('billingOs')?.quotas || {},
  getCredits: () => store.get('billingOs')?.credits || {},
  getWallet: () => store.get('billingOs')?.wallet || {},
  getCommerce: () => store.get('billingOs')?.commerce || {},
  getCatalog: () => store.get('billingOs')?.catalog || {},
  getPricing: () => store.get('billingOs')?.pricing || {},
  getDiscounts: () => store.get('billingOs')?.discounts || {},
  getCoupons: () => store.get('billingOs')?.coupons || {},
  getEntitlements: () => store.get('billingOs')?.entitlements || {},
  getMetering: () => store.get('billingOs')?.metering || {},
  getAnalytics: () => store.get('billingOs')?.analytics || {},
  getInsights: () => store.get('billingOs')?.insights || {},
  getTelemetry: () => store.get('billingOs')?.telemetry || {},
  getObservability: () => store.get('billingOs')?.observability || {},
  getGovernance: () => store.get('billingOs')?.governance || {},
  refresh: () => billingOsFoundation.snapshot(),
};

=======
>>>>>>> c274e1dce2d6e6ff268d5687f962db62d5191980
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
<<<<<<< HEAD
export default { modal, slideover, loading, auth, notify, events, telemetry, observability, integrations, workflows, knowledge, financial, legalOperations, clientExperience, aiOs, compliance, analytics, platformOs, uiOs, workspaceOs, billingOs, tenant, shellStore, billing };
=======
export default { modal, slideover, loading, auth, notify, events, telemetry, observability, integrations, workflows, knowledge, financial, legalOperations, clientExperience, aiOs, compliance, analytics, tenant, shellStore, billing };
>>>>>>> c274e1dce2d6e6ff268d5687f962db62d5191980
