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
