import { Shell } from '../ui/Shell.js';

function byId(id) {
  return document.getElementById(id);
}

export class DocumentModuleController {
  constructor({ supabase }) {
    this.supabase = supabase;
    this.shell = new Shell();
    this.currentUser = null;
    this.isAdmin = false;
    this.viewMode = 'cliente';
    this.viewingUid = null;
    this.engine = null;
    this.uploader = null;
    this.signatureService = null;
    this.activeFilter = 'all';
    this.drawerDocId = null;
    this.drawerSignedUrl = null;
    this.reviewWorkflow = null;
    this.booting = false;
    this.unmountModeSelector = null;
    this.subscriptions = [];
  }

  beginBootstrap() {
    if (this.booting) return false;
    this.booting = true;
    return true;
  }

  endBootstrap() {
    this.booting = false;
  }

  async requireSession() {
    const { data: { session } } = await this.supabase.auth.getSession();
    if (!session) {
      window.location.href = 'login.html';
      return null;
    }

    this.currentUser = session.user;
    return session;
  }

  initShell() {
    this.shell.init();
  }

  async loadAdminContext({ onModeChange } = {}) {
    if (!this.currentUser) return;

    const { data: adminRow } = await this.supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', this.currentUser.id)
      .maybeSingle();

    this.isAdmin = !!adminRow;
    this.viewingUid = new URLSearchParams(window.location.search).get('uid') || null;

    if (!this.isAdmin) return;

    this.viewMode = window.getPortalViewMode?.() || 'admin';
    const adminBar = byId('doc-admin-bar');
    if (adminBar) adminBar.style.display = 'flex';

    if (typeof this.unmountModeSelector === 'function') this.unmountModeSelector();
    if (typeof window.mountPortalViewModeSelector === 'function') {
      this.unmountModeSelector = window.mountPortalViewModeSelector('doc-mode-selector', {
        adminLabel: 'Admin',
        onChange: onModeChange,
      });
      window.setPortalViewMode?.(this.viewMode, { source: 'documentos-init' });
    }

    if (this.viewingUid) {
      const backBtn = byId('btn-back-client');
      const contextEl = byId('doc-admin-context');
      if (backBtn) backBtn.style.display = '';
      if (contextEl) contextEl.textContent = 'Revisando documentos do cliente';
    }
  }

  resolveDocumentService(documentService) {
    if (this.viewingUid && this.isAdmin) {
      return { ...documentService, list: () => documentService.listForUser(this.viewingUid) };
    }
    return documentService;
  }

  setViewMode(mode) {
    this.viewMode = mode;
  }

  setServices({ engine = null, uploader = null, signatureService = null } = {}) {
    if (engine) this.engine = engine;
    if (uploader) this.uploader = uploader;
    if (signatureService) this.signatureService = signatureService;
  }

  setActiveFilter(filter) {
    this.activeFilter = filter || 'all';
  }

  openDrawer(docId) {
    this.drawerDocId = docId;
    this.drawerSignedUrl = null;
    this.reviewWorkflow = null;
  }

  setDrawerSignedUrl(url) {
    this.drawerSignedUrl = url || null;
  }

  closeDrawer() {
    this.drawerDocId = null;
    this.drawerSignedUrl = null;
    this.reviewWorkflow = null;
  }

  setReviewWorkflow(workflowStatus) {
    this.reviewWorkflow = workflowStatus || null;
  }

  addSubscription(unsubscribe) {
    if (typeof unsubscribe === 'function') this.subscriptions.push(unsubscribe);
  }

  clearSubscriptions() {
    this.subscriptions.forEach(unsubscribe => {
      try { unsubscribe(); } catch (_) {}
    });
    this.subscriptions = [];
  }

  cleanup() {
    if (typeof this.unmountModeSelector === 'function') {
      this.unmountModeSelector();
      this.unmountModeSelector = null;
    }
    this.clearSubscriptions();
    this.closeDrawer();
    this.endBootstrap();
  }
}
