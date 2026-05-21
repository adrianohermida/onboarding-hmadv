/**
 * ShellStore — reactive global state for the portal shell.
 *
 * Tiny reactive store using EventTarget.
 * Modules MUST NOT import this directly — use shell/contracts instead.
 *
 * Shape:
 *   sidebar   : { collapsed: bool, open: bool }
 *   auth      : { user, isAdmin, loaded }
 *   tenant    : { id, name, branding }
 *   modals    : { stack: [] }
 *   slideovers: { stack: [] }
 *   notifications: { items: [], unreadCount: 0 }
 *   billing   : { subscription, usage, quotas, entitlements, cost, economics }
 *   integrations: { providers, health, telemetry, queue_depth, generated_at }
 *   workflows: { definitions, lifecycle, telemetry, sla, tasks, approvals, escalations, queue, generated_at }
 *   knowledge: { metadata, lifecycle, classifications, timeline, knowledge, generated_at }
 *   financial: { debts, expenses, income, commitment, diagnosis, alerts, telemetry, generated_at }
 *   legalOperations: { lifecycle, timeline, sla, risk, productivity, monitoring, analytics, telemetry, generated_at }
 *   clientExperience: { journeys, engagement, notifications, progress, retention, satisfaction, observability, analytics, telemetry, generated_at }
 *   aiOs      : { agents, copilot, retrieval, actions, human_review, telemetry, observability, analytics, generated_at }
 *   compliance: { lgpd, consents, audit, risk, access, incidents, monitoring, telemetry, analytics, generated_at }
 *   analytics : { metrics, kpis, executive, financial, legal, operations, onboarding, engagement, productivity, sla, tenants, risk, insights, predictions, observability, telemetry, governance, generated_at }
 *   platformOs: { runtime, deployments, scaling, performance, queues, workers, resilience, monitoring, telemetry, analytics, governance, observability, generated_at }
 *   uiOs      : { tokens, theme, typography, layouts, navigation, workspace, command_center, modals, drawers, tables, forms, cards, timelines, states, feedback, animations, mobile, accessibility, branding, telemetry, observability, governance, generated_at }
 *   workspaceOs: { command_center, search, context, copilot, activities, panels, workspace, navigation, actions, shortcuts, assistant, notifications, streams, inspector, quick_actions, dock, mobile, analytics, telemetry, observability, governance, generated_at }
 *   billingOs : { plans, subscriptions, checkout, customers, payments, invoices, usage, quotas, credits, wallet, commerce, catalog, pricing, discounts, coupons, entitlements, metering, analytics, insights, telemetry, observability, governance, generated_at }
 *   route     : { current, previous, loading }
 *   viewMode  : 'cliente' | 'advogado' | 'admin'
 */

const SIDEBAR_KEY = 'portal:sidebar-collapsed';

const _initialState = () => ({
  sidebar: {
    collapsed: _readSidebarPref(),
    open:      false,   // mobile overlay open
  },
  auth: {
    user:    null,
    isAdmin: false,
    loaded:  false,
  },
  tenant: {
    id:       'hmadv',
    name:     'Hermida Maia Advocacia',
    branding: { primary: '#1A3A5C', accent: '#F5A623' },
  },
  modals:    { stack: [] },
  slideovers:{ stack: [] },
  notifications: { items: [], unreadCount: 0 },
  billing: {
    subscription: null,
    usage: {},
    quotas: {},
    entitlements: null,
    cost: null,
    economics: null,
  },
  integrations: {
    providers: [],
    health: { global: 'unknown', providers: {} },
    telemetry: { total: 0, failures: 0, retries: 0, sla_violations: 0, degraded: 0, list: [] },
    queue_depth: 0,
    generated_at: null,
  },
  workflows: {
    definitions: [],
    lifecycle: { total: 0, active: 0, completed: 0, archived: 0, list: [] },
    telemetry: { total: 0, failures: 0, retries: 0, escalations: 0, stuck: 0, throughput: 0, list: [] },
    sla: { total: 0, overdue: 0, policies: {}, list: [] },
    tasks: { total: 0, open: 0, overdue: 0, list: [] },
    approvals: { total: 0, pending: 0, list: [] },
    escalations: { total: 0, open: 0, list: [] },
    queue: { depth: 0 },
    generated_at: null,
  },
  knowledge: {
    metadata: { total: 0, list: [] },
    lifecycle: { total: 0, uploaded: 0, pending_review: 0, approved: 0, signed: 0, archived: 0, retained: 0, list: [] },
    classifications: { total: 0, list: [] },
    versions: { total: 0, list: [] },
    evidence: { total: 0, list: [] },
    timeline: { total: 0, list: [] },
    search_index: { total: 0 },
    knowledge: {
      domains: [],
      videos: { onboarding: 0, cnj: 0 },
      journey: { total: 0, completed: 0, list: [] },
      telemetry: { total: 0, videos_watched: 0, onboarding_progress_events: 0, documents_accessed: 0, template_used: 0, onboarding_abandonment: 0, list: [] },
    },
    search: { metadata_query_all: 0 },
    generated_at: null,
  },
  financial: {
    debts: [],
    expenses: [],
    income: [],
    commitment: {
      income_total: 0,
      debt_total: 0,
      essential_total: 0,
      expense_total: 0,
      commitment_income: 0,
      commitment_essential: 0,
      commitment_net: 0,
      commitment_after_minimum: 0,
      payment_capacity: 0,
    },
    minimum_existential: null,
    diagnosis: null,
    monitoring: null,
    alerts: { total: 0, alerts: [] },
    timeline: { total: 0, list: [] },
    telemetry: { total: 0, updates: 0, renegotiations: 0, payments: 0, simulations: 0, plans: 0, list: [] },
    analytics: null,
    generated_at: null,
  },
  legalOperations: {
    lifecycle: { total: 0, active: 0, completed: 0, archived: 0, list: [] },
    timeline: { total: 0, list: [] },
    tasks: { total: 0, open: 0, overdue: 0, list: [] },
    sla: { total: 0, overdue: 0, policies: {}, list: [] },
    risk: { total: 0, critical: 0, list: [] },
    productivity: { tasks_total: 0, completed: 0, open: 0, active_owners: 0, throughput: 0, bottlenecks: [] },
    monitoring: { critical_cases: 0, onboarding_stalled: 0, negotiation_stalled: 0, pending_documents: 0, pending_agreements: 0, overdue_deadlines: 0, open_tasks: 0 },
    analytics: null,
    telemetry: { total: 0, transitions: 0, uploads: 0, revisions: 0, negotiations: 0, approvals: 0, tasks: 0, sla: 0, list: [] },
    generated_at: null,
  },
  clientExperience: {
    journeys: { total: 0, list: [] },
    engagement: { total: 0, list: [] },
    communications: { total: 0, list: [] },
    notifications: { total: 0, list: [] },
    emotional_ux: null,
    education: { total: 0, list: [] },
    guidance: { total: 0, list: [] },
    assistants: [],
    personalization: { total: 0, list: [] },
    progress: { total: 0, completed: 0, list: [] },
    gamification: null,
    success: null,
    feedback: { total: 0, list: [] },
    satisfaction: null,
    retention: { total: 0, high_risk: 0, list: [] },
    vulnerability: { total: 0, high: 0, list: [] },
    observability: { onboarding_abandonment: 0, upload_friction: 0, ux_bottlenecks: 0, client_delays: 0 },
    analytics: null,
    telemetry: { total: 0, onboarding: 0, notifications: 0, uploads: 0, progress: 0, feedbacks: 0, list: [] },
    generated_at: null,
  },
  aiOs: {
    agents: [],
    copilot: { total: 0, list: [] },
    retrieval: { total: 0, list: [] },
    actions: { total: 0, list: [] },
    human_review: { total: 0, pending: 0, list: [] },
    telemetry: { total: 0, failures: 0, retries: 0, escalations: 0, human_review: 0, avg_latency_ms: 0, list: [] },
    observability: { hallucination_risk: 0, workflow_misuse: 0, unsafe_actions: 0, tenant_violations: 0, prompt_failures: 0, degraded_responses: 0 },
    analytics: null,
    generated_at: null,
  },
  compliance: {
    lgpd: null,
    consents: { total: 0, accepted: 0, revoked: 0, list: [] },
    privacy: null,
    retention: null,
    classification: { total: 0, list: [] },
    lineage: { total: 0, list: [] },
    audit: { total: 0, list: [] },
    risk: { total: 0, high: 0, list: [] },
    access: { total: 0, suspicious: 0, list: [] },
    incidents: { total: 0, open: 0, list: [] },
    monitoring: { sensitive_access: 0, suspicious_access: 0, missing_audit_trails: 0, missing_consents: 0, tenant_violations: 0, retention_failures: 0, open_incidents: 0, audit_health: 0 },
    security: null,
    reports: null,
    data_subject_foundation: null,
    governance: null,
    telemetry: { total: 0, consent_events: 0, access_events: 0, audit_events: 0, violations: 0, anomalies: 0, list: [] },
    analytics: null,
    generated_at: null,
  },
  analytics: {
    domain_entities: [],
    dashboards: [],
    metrics: { total: 0, list: [] },
    kpis: null,
    executive: null,
    financial: null,
    legal: null,
    operations: null,
    onboarding: null,
    engagement: null,
    productivity: null,
    sla: null,
    tenants: null,
    risk: null,
    insights: null,
    predictions: null,
    client_recovery: null,
    ai: null,
    observability: { missing_metrics: 0, broken_pipelines: 0, inconsistent_dashboards: 0, stale_data: 0, analytics_degradation: 0 },
    telemetry: { total: 0, metrics: 0, dashboards: 0, kpis: 0, insights: 0, stale_data: 0, degraded_data: 0, list: [] },
    warehouse: null,
    governance: null,
    generated_at: null,
  },
  platformOs: {
    domain_entities: [],
    runtime: null,
    deployments: { total: 0, failed: 0, list: [] },
    scaling: null,
    performance: null,
    caching: null,
    edge: null,
    queues: { total: 0, queued: 0, processing: 0, failed: 0, dead_letter: 0, throttled: 0, retries: 0, list: [] },
    workers: { total: 0, online: 0, degraded: 0, failed: 0, retries: 0, isolated: 0, list: [] },
    resilience: null,
    failover: null,
    backup: null,
    recovery: null,
    storage: null,
    network: null,
    cdn: null,
    security: null,
    environments: null,
    tenants: null,
    monitoring: null,
    telemetry: { total: 0, deployments: 0, runtime: 0, queues: 0, workers: 0, scaling: 0, performance: 0, degraded: 0, failed: 0, list: [] },
    analytics: null,
    governance: null,
    observability: { degraded_runtime: 0, queue_overload: 0, deployment_failures: 0, tenant_degradation: 0, upload_degradation: 0 },
    generated_at: null,
  },
  uiOs: {
    domain_entities: [],
    components: [],
    tokens: null,
    theme: null,
    typography: null,
    layouts: null,
    navigation: null,
    workspace: null,
    command_center: { total: 0, navigation: 0, workflow: 0, client: 0, list: [] },
    copilot: null,
    modals: null,
    drawers: null,
    tables: null,
    forms: null,
    cards: null,
    timelines: null,
    states: null,
    feedback: null,
    animations: null,
    mobile: null,
    gestures: null,
    icons: null,
    charts: null,
    accessibility: null,
    branding: null,
    telemetry: { total: 0, interactions: 0, modals: 0, mobile: 0, render: 0, onboarding_friction: 0, failed: 0, degraded: 0, list: [] },
    observability: { hydration_failures: 0, rendering_failures: 0, mobile_rendering_issues: 0, responsiveness_issues: 0, ux_bottlenecks: 0 },
    governance: null,
    generated_at: null,
  },
  workspaceOs: {
    domain_entities: [],
    command_center: { total: 0, navigation: 0, workflow: 0, copilot: 0, quick_actions: 0, list: [] },
    search: { total: 0, results: 0, by_type: {}, list: [] },
    context: null,
    copilot: null,
    activities: { total: 0, uploads: 0, onboarding: 0, workflows: 0, approvals: 0, ai_suggestions: 0, list: [] },
    panels: null,
    workspace: { tabs: [], current_context: null, history: [], filters: {}, layout: 'multi-panel', copilot_state: 'idle', open_tabs: 0 },
    navigation: { breadcrumbs: [], history: [], recent_items: [], pinned_items: [], tab_persistence_ready: true },
    actions: null,
    shortcuts: null,
    assistant: null,
    notifications: { total: 0, onboarding: 0, documents: 0, workflows: 0, ai_insights: 0, approvals: 0, risks: 0, list: [] },
    streams: { realtime_ready: true, total: 0, uploads: 0, onboarding: 0, workflows: 0, approvals: 0, list: [] },
    inspector: null,
    quick_actions: { total: 0, list: [], smart_actions_ready: true },
    dock: null,
    mobile: null,
    analytics: null,
    telemetry: { total: 0, navigation: 0, search: 0, quick_actions: 0, copilot_usage: 0, workspace_switching: 0, tab_usage: 0, failed: 0, degraded: 0, list: [] },
    observability: { navigation_bottlenecks: 0, search_latency: 0, drawer_failures: 0, modal_failures: 0, hydration_failures: 0, context_failures: 0 },
    governance: null,
    generated_at: null,
  },
  billingOs: {
    domain_entities: [],
    plans: { current: 'starter', catalog: [] },
    subscriptions: { subscription_id: null, tenant_id: 'hmadv', plan_code: 'starter', status: 'active', trial_active: false, renewal_at: null, canceled_at: null, updated_at: null, tenant_subscriptions_ready: true },
    checkout: null,
    customers: null,
    payments: { stripe_foundation: true, checkout_session: null, payment_intent: null },
    invoices: { total: 0, paid: 0, overdue: 0, pending: 0, list: [] },
    usage: { ai_usage: 0, storage_usage_mb: 0, workflow_usage: 0, onboarding_usage: 0, integrations_usage: 0, analytics_usage: 0, users_usage: 0, clients_usage: 0, uploads_usage: 0 },
    quotas: { users: { used: 0, limit: 0, ratio: 0, state: 'ok' } },
    credits: { ai_credits: 0, workflow_credits: 0, onboarding_credits: 0, storage_credits: 0 },
    wallet: { enabled: false, future_ready: true, balance_cents: 0 },
    commerce: { marketplace_ready: true, legal_services_ready: true, addons: [] },
    catalog: { plans: [], addons: [] },
    pricing: { currency: 'BRL', plans: {}, feature_comparison_ready: true, tenant_pricing_ready: true, promotional_pricing_ready: true },
    discounts: { coupons_ready: true, discounts_ready: true, promotional_offers_ready: true, enterprise_pricing_ready: true },
    coupons: { enabled: true, coupons: [] },
    entitlements: { tenant_id: 'hmadv', plan_code: 'starter', features: {}, limits: {} },
    metering: { usage_billing_ready: true, metered_events: 0 },
    analytics: { revenue_cents: 0, subscriptions: 0, churn_risk: 0, upgrades: 0, usage_pressure: 0, onboarding_conversion: 0, ai_consumption: 0 },
    insights: { churn_risk: 'low', upsell_opportunities: [], usage_spikes: [], enterprise_opportunities: [], ai_monetization_future: true },
    telemetry: { total: 0, subscriptions: 0, invoices: 0, payments: 0, quotas: 0, usage: 0, upgrades: 0, downgrades: 0, failed: 0, degraded: 0, list: [] },
    observability: { payment_failures: 0, webhook_failures: 0, quota_failures: 0, subscription_failures: 0, billing_degradation: 0 },
    governance: null,
    legacy_billing_bridge: null,
    generated_at: null,
  },
  route: { current: null, previous: null, loading: false },
  viewMode: 'cliente',
});

function _readSidebarPref() {
  try { return localStorage.getItem(SIDEBAR_KEY) === '1'; } catch { return false; }
}

function _writeSidebarPref(val) {
  try { localStorage.setItem(SIDEBAR_KEY, val ? '1' : '0'); } catch {}
}

class ShellStore extends EventTarget {
  constructor() {
    super();
    this._state = _initialState();
  }

  // ── Read ────────────────────────────────────────────────────────────────────
  getState() { return this._state; }
  get(key)   { return this._state[key]; }

  // ── Write ───────────────────────────────────────────────────────────────────
  _set(slice, patch) {
    const prev = this._state[slice];
    this._state[slice] = typeof prev === 'object' && !Array.isArray(prev)
      ? { ...prev, ...patch }
      : patch;
    this.dispatchEvent(new CustomEvent('change', {
      detail: { slice, state: this._state[slice], prev },
    }));
    this.dispatchEvent(new CustomEvent(`change:${slice}`, {
      detail: { state: this._state[slice], prev },
    }));
  }

  // ── Sidebar ─────────────────────────────────────────────────────────────────
  setSidebarCollapsed(val) {
    this._set('sidebar', { collapsed: val });
    _writeSidebarPref(val);
    document.querySelector('.portal-shell')?.classList.toggle('sidebar-collapsed', val);
  }

  toggleSidebarCollapsed() {
    this.setSidebarCollapsed(!this._state.sidebar.collapsed);
  }

  setSidebarOpen(val) {
    this._set('sidebar', { open: val });
    document.querySelector('.sidebar')?.classList.toggle('sidebar-open', val);
    const overlay = document.getElementById('sidebar-overlay');
    if (overlay) overlay.classList.toggle('visible', val);
    document.body.style.overflow = val ? 'hidden' : '';
  }

  // ── Auth ────────────────────────────────────────────────────────────────────
  setAuth({ user, isAdmin }) {
    this._set('auth', { user, isAdmin, loaded: true });
  }

  // ── ViewMode ─────────────────────────────────────────────────────────────────
  setViewMode(mode) {
    if (!['cliente', 'advogado', 'admin'].includes(mode)) return;
    this._state.viewMode = mode;
    this.dispatchEvent(new CustomEvent('change:viewMode', { detail: { mode } }));
    document.dispatchEvent(new CustomEvent('shell:viewmode-changed', { detail: { mode } }));
  }

  getViewMode() { return this._state.viewMode; }

  // ── Route ───────────────────────────────────────────────────────────────────
  setRouteLoading(val) { this._set('route', { loading: val }); }
  setCurrentRoute(path) {
    this._set('route', { previous: this._state.route.current, current: path, loading: false });
  }

  // ── Notifications ────────────────────────────────────────────────────────────
  addNotification(item) {
    const items = [{ ...item, id: item.id || Date.now(), read: false }, ...this._state.notifications.items];
    const unreadCount = items.filter(n => !n.read).length;
    this._set('notifications', { items, unreadCount });
  }

  markNotificationsRead() {
    const items = this._state.notifications.items.map(n => ({ ...n, read: true }));
    this._set('notifications', { items, unreadCount: 0 });
  }

  // ── Billing ─────────────────────────────────────────────────────────────────
  setBillingSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== 'object') return;
    this._set('billing', {
      subscription: snapshot.subscription || null,
      usage: snapshot.usage || {},
      quotas: snapshot.quotas || {},
      entitlements: snapshot.entitlements || null,
      cost: snapshot.cost || null,
      economics: snapshot.economics || null,
      generated_at: snapshot.generated_at || new Date().toISOString(),
    });
  }

  // ── Integrations ───────────────────────────────────────────────────────────
  setIntegrationSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== 'object') return;
    this._set('integrations', {
      providers: Array.isArray(snapshot.providers) ? snapshot.providers : [],
      health: snapshot.health || { global: 'unknown', providers: {} },
      telemetry: snapshot.telemetry || { total: 0, failures: 0, retries: 0, sla_violations: 0, degraded: 0, list: [] },
      queue_depth: Number(snapshot.queue_depth) || 0,
      generated_at: snapshot.generated_at || new Date().toISOString(),
    });
  }

  // ── Workflows ─────────────────────────────────────────────────────────────
  setWorkflowSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== 'object') return;
    this._set('workflows', {
      definitions: Array.isArray(snapshot.definitions) ? snapshot.definitions : [],
      lifecycle: snapshot.lifecycle || { total: 0, active: 0, completed: 0, archived: 0, list: [] },
      telemetry: snapshot.telemetry || { total: 0, failures: 0, retries: 0, escalations: 0, stuck: 0, throughput: 0, list: [] },
      sla: snapshot.sla || { total: 0, overdue: 0, policies: {}, list: [] },
      tasks: snapshot.tasks || { total: 0, open: 0, overdue: 0, list: [] },
      approvals: snapshot.approvals || { total: 0, pending: 0, list: [] },
      escalations: snapshot.escalations || { total: 0, open: 0, list: [] },
      queue: snapshot.queue || { depth: 0 },
      generated_at: snapshot.generated_at || new Date().toISOString(),
    });
  }

  // ── Knowledge ─────────────────────────────────────────────────────────────
  setKnowledgeSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== 'object') return;
    this._set('knowledge', {
      metadata: snapshot.metadata || { total: 0, list: [] },
      lifecycle: snapshot.lifecycle || { total: 0, uploaded: 0, pending_review: 0, approved: 0, signed: 0, archived: 0, retained: 0, list: [] },
      classifications: snapshot.classifications || { total: 0, list: [] },
      versions: snapshot.versions || { total: 0, list: [] },
      evidence: snapshot.evidence || { total: 0, list: [] },
      timeline: snapshot.timeline || { total: 0, list: [] },
      search_index: snapshot.search_index || { total: 0 },
      knowledge: snapshot.knowledge || {
        domains: [],
        videos: { onboarding: 0, cnj: 0 },
        journey: { total: 0, completed: 0, list: [] },
        telemetry: { total: 0, videos_watched: 0, onboarding_progress_events: 0, documents_accessed: 0, template_used: 0, onboarding_abandonment: 0, list: [] },
      },
      search: snapshot.search || { metadata_query_all: 0 },
      generated_at: snapshot.generated_at || new Date().toISOString(),
    });
  }

  // ── Financial ─────────────────────────────────────────────────────────────
  setFinancialSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== 'object') return;
    this._set('financial', {
      debts: Array.isArray(snapshot.debts) ? snapshot.debts : [],
      expenses: Array.isArray(snapshot.expenses) ? snapshot.expenses : [],
      income: Array.isArray(snapshot.income) ? snapshot.income : [],
      commitment: snapshot.commitment || {
        income_total: 0,
        debt_total: 0,
        essential_total: 0,
        expense_total: 0,
        commitment_income: 0,
        commitment_essential: 0,
        commitment_net: 0,
        commitment_after_minimum: 0,
        payment_capacity: 0,
      },
      minimum_existential: snapshot.minimum_existential || null,
      diagnosis: snapshot.diagnosis || null,
      monitoring: snapshot.monitoring || null,
      alerts: snapshot.alerts || { total: 0, alerts: [] },
      timeline: snapshot.timeline || { total: 0, list: [] },
      telemetry: snapshot.telemetry || { total: 0, updates: 0, renegotiations: 0, payments: 0, simulations: 0, plans: 0, list: [] },
      analytics: snapshot.analytics || null,
      generated_at: snapshot.generated_at || new Date().toISOString(),
    });
  }

  // ── Legal Operations ──────────────────────────────────────────────────────
  setLegalOperationsSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== 'object') return;
    this._set('legalOperations', {
      lifecycle: snapshot.lifecycle || { total: 0, active: 0, completed: 0, archived: 0, list: [] },
      timeline: snapshot.timeline || { total: 0, list: [] },
      tasks: snapshot.tasks || { total: 0, open: 0, overdue: 0, list: [] },
      sla: snapshot.sla || { total: 0, overdue: 0, policies: {}, list: [] },
      risk: snapshot.risk || { total: 0, critical: 0, list: [] },
      productivity: snapshot.productivity || { tasks_total: 0, completed: 0, open: 0, active_owners: 0, throughput: 0, bottlenecks: [] },
      monitoring: snapshot.monitoring || { critical_cases: 0, onboarding_stalled: 0, negotiation_stalled: 0, pending_documents: 0, pending_agreements: 0, overdue_deadlines: 0, open_tasks: 0 },
      analytics: snapshot.analytics || null,
      telemetry: snapshot.telemetry || { total: 0, transitions: 0, uploads: 0, revisions: 0, negotiations: 0, approvals: 0, tasks: 0, sla: 0, list: [] },
      generated_at: snapshot.generated_at || new Date().toISOString(),
    });
  }

  // ── Client Experience ────────────────────────────────────────────────────
  setClientExperienceSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== 'object') return;
    this._set('clientExperience', {
      journeys: snapshot.journeys || { total: 0, list: [] },
      engagement: snapshot.engagement || { total: 0, list: [] },
      communications: snapshot.communications || { total: 0, list: [] },
      notifications: snapshot.notifications || { total: 0, list: [] },
      emotional_ux: snapshot.emotional_ux || null,
      education: snapshot.education || { total: 0, list: [] },
      guidance: snapshot.guidance || { total: 0, list: [] },
      assistants: Array.isArray(snapshot.assistants) ? snapshot.assistants : [],
      personalization: snapshot.personalization || { total: 0, list: [] },
      progress: snapshot.progress || { total: 0, completed: 0, list: [] },
      gamification: snapshot.gamification || null,
      success: snapshot.success || null,
      feedback: snapshot.feedback || { total: 0, list: [] },
      satisfaction: snapshot.satisfaction || null,
      retention: snapshot.retention || { total: 0, high_risk: 0, list: [] },
      vulnerability: snapshot.vulnerability || { total: 0, high: 0, list: [] },
      observability: snapshot.observability || { onboarding_abandonment: 0, upload_friction: 0, ux_bottlenecks: 0, client_delays: 0 },
      analytics: snapshot.analytics || null,
      telemetry: snapshot.telemetry || { total: 0, onboarding: 0, notifications: 0, uploads: 0, progress: 0, feedbacks: 0, list: [] },
      generated_at: snapshot.generated_at || new Date().toISOString(),
    });
  }

  // ── AI OS ────────────────────────────────────────────────────────────────
  setAiOsSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== 'object') return;
    this._set('aiOs', {
      agents: Array.isArray(snapshot.agents) ? snapshot.agents : [],
      copilot: snapshot.copilot || { total: 0, list: [] },
      retrieval: snapshot.retrieval || { total: 0, list: [] },
      actions: snapshot.actions || { total: 0, list: [] },
      human_review: snapshot.human_review || { total: 0, pending: 0, list: [] },
      telemetry: snapshot.telemetry || { total: 0, failures: 0, retries: 0, escalations: 0, human_review: 0, avg_latency_ms: 0, list: [] },
      observability: snapshot.observability || { hallucination_risk: 0, workflow_misuse: 0, unsafe_actions: 0, tenant_violations: 0, prompt_failures: 0, degraded_responses: 0 },
      analytics: snapshot.analytics || null,
      generated_at: snapshot.generated_at || new Date().toISOString(),
    });
  }

  // ── Compliance ───────────────────────────────────────────────────────────
  setComplianceSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== 'object') return;
    this._set('compliance', {
      lgpd: snapshot.lgpd || null,
      consents: snapshot.consents || { total: 0, accepted: 0, revoked: 0, list: [] },
      privacy: snapshot.privacy || null,
      retention: snapshot.retention || null,
      classification: snapshot.classification || { total: 0, list: [] },
      lineage: snapshot.lineage || { total: 0, list: [] },
      audit: snapshot.audit || { total: 0, list: [] },
      risk: snapshot.risk || { total: 0, high: 0, list: [] },
      access: snapshot.access || { total: 0, suspicious: 0, list: [] },
      incidents: snapshot.incidents || { total: 0, open: 0, list: [] },
      monitoring: snapshot.monitoring || { sensitive_access: 0, suspicious_access: 0, missing_audit_trails: 0, missing_consents: 0, tenant_violations: 0, retention_failures: 0, open_incidents: 0, audit_health: 0 },
      security: snapshot.security || null,
      reports: snapshot.reports || null,
      data_subject_foundation: snapshot.data_subject_foundation || null,
      governance: snapshot.governance || null,
      telemetry: snapshot.telemetry || { total: 0, consent_events: 0, access_events: 0, audit_events: 0, violations: 0, anomalies: 0, list: [] },
      analytics: snapshot.analytics || null,
      generated_at: snapshot.generated_at || new Date().toISOString(),
    });
  }

  // ── Analytics ────────────────────────────────────────────────────────────
  setAnalyticsSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== 'object') return;
    this._set('analytics', {
      domain_entities: Array.isArray(snapshot.domain_entities) ? snapshot.domain_entities : [],
      dashboards: Array.isArray(snapshot.dashboards) ? snapshot.dashboards : [],
      metrics: snapshot.metrics || { total: 0, list: [] },
      kpis: snapshot.kpis || null,
      executive: snapshot.executive || null,
      financial: snapshot.financial || null,
      legal: snapshot.legal || null,
      operations: snapshot.operations || null,
      onboarding: snapshot.onboarding || null,
      engagement: snapshot.engagement || null,
      productivity: snapshot.productivity || null,
      sla: snapshot.sla || null,
      tenants: snapshot.tenants || null,
      risk: snapshot.risk || null,
      insights: snapshot.insights || null,
      predictions: snapshot.predictions || null,
      client_recovery: snapshot.client_recovery || null,
      ai: snapshot.ai || null,
      observability: snapshot.observability || { missing_metrics: 0, broken_pipelines: 0, inconsistent_dashboards: 0, stale_data: 0, analytics_degradation: 0 },
      telemetry: snapshot.telemetry || { total: 0, metrics: 0, dashboards: 0, kpis: 0, insights: 0, stale_data: 0, degraded_data: 0, list: [] },
      warehouse: snapshot.warehouse || null,
      governance: snapshot.governance || null,
      generated_at: snapshot.generated_at || new Date().toISOString(),
    });
  }

  // ── Platform OS ─────────────────────────────────────────────────────────
  setPlatformOsSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== 'object') return;
    this._set('platformOs', {
      domain_entities: Array.isArray(snapshot.domain_entities) ? snapshot.domain_entities : [],
      runtime: snapshot.runtime || null,
      deployments: snapshot.deployments || { total: 0, failed: 0, list: [] },
      scaling: snapshot.scaling || null,
      performance: snapshot.performance || null,
      caching: snapshot.caching || null,
      edge: snapshot.edge || null,
      queues: snapshot.queues || { total: 0, queued: 0, processing: 0, failed: 0, dead_letter: 0, throttled: 0, retries: 0, list: [] },
      workers: snapshot.workers || { total: 0, online: 0, degraded: 0, failed: 0, retries: 0, isolated: 0, list: [] },
      resilience: snapshot.resilience || null,
      failover: snapshot.failover || null,
      backup: snapshot.backup || null,
      recovery: snapshot.recovery || null,
      storage: snapshot.storage || null,
      network: snapshot.network || null,
      cdn: snapshot.cdn || null,
      security: snapshot.security || null,
      environments: snapshot.environments || null,
      tenants: snapshot.tenants || null,
      monitoring: snapshot.monitoring || null,
      telemetry: snapshot.telemetry || { total: 0, deployments: 0, runtime: 0, queues: 0, workers: 0, scaling: 0, performance: 0, degraded: 0, failed: 0, list: [] },
      analytics: snapshot.analytics || null,
      governance: snapshot.governance || null,
      observability: snapshot.observability || { degraded_runtime: 0, queue_overload: 0, deployment_failures: 0, tenant_degradation: 0, upload_degradation: 0 },
      generated_at: snapshot.generated_at || new Date().toISOString(),
    });
  }

  // ── UI OS ───────────────────────────────────────────────────────────────
  setUiOsSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== 'object') return;
    this._set('uiOs', {
      domain_entities: Array.isArray(snapshot.domain_entities) ? snapshot.domain_entities : [],
      components: Array.isArray(snapshot.components) ? snapshot.components : [],
      tokens: snapshot.tokens || null,
      theme: snapshot.theme || null,
      typography: snapshot.typography || null,
      layouts: snapshot.layouts || null,
      navigation: snapshot.navigation || null,
      workspace: snapshot.workspace || null,
      command_center: snapshot.command_center || { total: 0, navigation: 0, workflow: 0, client: 0, list: [] },
      copilot: snapshot.copilot || null,
      modals: snapshot.modals || null,
      drawers: snapshot.drawers || null,
      tables: snapshot.tables || null,
      forms: snapshot.forms || null,
      cards: snapshot.cards || null,
      timelines: snapshot.timelines || null,
      states: snapshot.states || null,
      feedback: snapshot.feedback || null,
      animations: snapshot.animations || null,
      mobile: snapshot.mobile || null,
      gestures: snapshot.gestures || null,
      icons: snapshot.icons || null,
      charts: snapshot.charts || null,
      accessibility: snapshot.accessibility || null,
      branding: snapshot.branding || null,
      telemetry: snapshot.telemetry || { total: 0, interactions: 0, modals: 0, mobile: 0, render: 0, onboarding_friction: 0, failed: 0, degraded: 0, list: [] },
      observability: snapshot.observability || { hydration_failures: 0, rendering_failures: 0, mobile_rendering_issues: 0, responsiveness_issues: 0, ux_bottlenecks: 0 },
      governance: snapshot.governance || null,
      generated_at: snapshot.generated_at || new Date().toISOString(),
    });
  }

  // ── Workspace OS ───────────────────────────────────────────────────────
  setWorkspaceOsSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== 'object') return;
    this._set('workspaceOs', {
      domain_entities: Array.isArray(snapshot.domain_entities) ? snapshot.domain_entities : [],
      command_center: snapshot.command_center || { total: 0, navigation: 0, workflow: 0, copilot: 0, quick_actions: 0, list: [] },
      search: snapshot.search || { total: 0, results: 0, by_type: {}, list: [] },
      context: snapshot.context || null,
      copilot: snapshot.copilot || null,
      activities: snapshot.activities || { total: 0, uploads: 0, onboarding: 0, workflows: 0, approvals: 0, ai_suggestions: 0, list: [] },
      panels: snapshot.panels || null,
      workspace: snapshot.workspace || { tabs: [], current_context: null, history: [], filters: {}, layout: 'multi-panel', copilot_state: 'idle', open_tabs: 0 },
      navigation: snapshot.navigation || { breadcrumbs: [], history: [], recent_items: [], pinned_items: [], tab_persistence_ready: true },
      actions: snapshot.actions || null,
      shortcuts: snapshot.shortcuts || null,
      assistant: snapshot.assistant || null,
      notifications: snapshot.notifications || { total: 0, onboarding: 0, documents: 0, workflows: 0, ai_insights: 0, approvals: 0, risks: 0, list: [] },
      streams: snapshot.streams || { realtime_ready: true, total: 0, uploads: 0, onboarding: 0, workflows: 0, approvals: 0, list: [] },
      inspector: snapshot.inspector || null,
      quick_actions: snapshot.quick_actions || { total: 0, list: [], smart_actions_ready: true },
      dock: snapshot.dock || null,
      mobile: snapshot.mobile || null,
      analytics: snapshot.analytics || null,
      telemetry: snapshot.telemetry || { total: 0, navigation: 0, search: 0, quick_actions: 0, copilot_usage: 0, workspace_switching: 0, tab_usage: 0, failed: 0, degraded: 0, list: [] },
      observability: snapshot.observability || { navigation_bottlenecks: 0, search_latency: 0, drawer_failures: 0, modal_failures: 0, hydration_failures: 0, context_failures: 0 },
      governance: snapshot.governance || null,
      generated_at: snapshot.generated_at || new Date().toISOString(),
    });
  }

  // ── Billing OS ─────────────────────────────────────────────────────────
  setBillingOsSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== 'object') return;
    this._set('billingOs', {
      domain_entities: Array.isArray(snapshot.domain_entities) ? snapshot.domain_entities : [],
      plans: snapshot.plans || { current: 'starter', catalog: [] },
      subscriptions: snapshot.subscriptions || { subscription_id: null, tenant_id: 'hmadv', plan_code: 'starter', status: 'active', trial_active: false, renewal_at: null, canceled_at: null, updated_at: null, tenant_subscriptions_ready: true },
      checkout: snapshot.checkout || null,
      customers: snapshot.customers || null,
      payments: snapshot.payments || { stripe_foundation: true, checkout_session: null, payment_intent: null },
      invoices: snapshot.invoices || { total: 0, paid: 0, overdue: 0, pending: 0, list: [] },
      usage: snapshot.usage || { ai_usage: 0, storage_usage_mb: 0, workflow_usage: 0, onboarding_usage: 0, integrations_usage: 0, analytics_usage: 0, users_usage: 0, clients_usage: 0, uploads_usage: 0 },
      quotas: snapshot.quotas || { users: { used: 0, limit: 0, ratio: 0, state: 'ok' } },
      credits: snapshot.credits || { ai_credits: 0, workflow_credits: 0, onboarding_credits: 0, storage_credits: 0 },
      wallet: snapshot.wallet || { enabled: false, future_ready: true, balance_cents: 0 },
      commerce: snapshot.commerce || { marketplace_ready: true, legal_services_ready: true, addons: [] },
      catalog: snapshot.catalog || { plans: [], addons: [] },
      pricing: snapshot.pricing || { currency: 'BRL', plans: {}, feature_comparison_ready: true, tenant_pricing_ready: true, promotional_pricing_ready: true },
      discounts: snapshot.discounts || { coupons_ready: true, discounts_ready: true, promotional_offers_ready: true, enterprise_pricing_ready: true },
      coupons: snapshot.coupons || { enabled: true, coupons: [] },
      entitlements: snapshot.entitlements || { tenant_id: 'hmadv', plan_code: 'starter', features: {}, limits: {} },
      metering: snapshot.metering || { usage_billing_ready: true, metered_events: 0 },
      analytics: snapshot.analytics || { revenue_cents: 0, subscriptions: 0, churn_risk: 0, upgrades: 0, usage_pressure: 0, onboarding_conversion: 0, ai_consumption: 0 },
      insights: snapshot.insights || { churn_risk: 'low', upsell_opportunities: [], usage_spikes: [], enterprise_opportunities: [], ai_monetization_future: true },
      telemetry: snapshot.telemetry || { total: 0, subscriptions: 0, invoices: 0, payments: 0, quotas: 0, usage: 0, upgrades: 0, downgrades: 0, failed: 0, degraded: 0, list: [] },
      observability: snapshot.observability || { payment_failures: 0, webhook_failures: 0, quota_failures: 0, subscription_failures: 0, billing_degradation: 0 },
      governance: snapshot.governance || null,
      legacy_billing_bridge: snapshot.legacy_billing_bridge || null,
      generated_at: snapshot.generated_at || new Date().toISOString(),
    });
  }

  // ── Subscribe ────────────────────────────────────────────────────────────────
  subscribe(sliceOrAll, handler) {
    const event = sliceOrAll === '*' ? 'change' : `change:${sliceOrAll}`;
    this.addEventListener(event, handler);
    return () => this.removeEventListener(event, handler);
  }
}

// Singleton
export const store = new ShellStore();
export default store;
