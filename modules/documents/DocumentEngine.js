/**
 * DocumentEngine — central de gestão documental enterprise
 *
 * Gerencia o ciclo completo de documentos:
 * - CRUD com workflow 10-estados
 * - Timeline por documento
 * - Solicitações do escritório
 * - Versionamento
 * - Integração EventBus
 *
 * Eventos emitidos:
 *   document.created       — documento criado/enviado
 *   document.updated       — status/workflow atualizado
 *   document.approved      — aprovado pelo escritório
 *   document.rejected      — rejeitado pelo escritório
 *   document.archived      — arquivado
 *   document.list.changed  — qualquer alteração na lista
 *   signature.requested    — assinatura solicitada
 *   signature.completed    — assinatura concluída
 */
import { bus } from '../events/EventBus.js';

// ── Workflow States ────────────────────────────────────────────────────────────
export const WORKFLOW_STATES = {
  pendente_envio:          { label: 'Pendente',          color: '#94a3b8', bg: '#f8fafc', icon: '⏺',  clientAction: 'upload' },
  enviado:                 { label: 'Enviado',           color: '#2E6DA4', bg: '#eff6ff', icon: '📤', clientAction: null },
  recebido:                { label: 'Recebido',          color: '#0891b2', bg: '#ecfeff', icon: '📥', clientAction: null },
  em_analise:              { label: 'Em análise',        color: '#d97706', bg: '#fffbeb', icon: '🔍', clientAction: null },
  pendente_correcao:       { label: 'Correção necessária', color: '#ea580c', bg: '#fff7ed', icon: '✏️', clientAction: 'reupload' },
  aprovado:                { label: 'Aprovado',          color: '#16a34a', bg: '#f0fdf4', icon: '✅', clientAction: null },
  rejeitado:               { label: 'Rejeitado',         color: '#dc2626', bg: '#fef2f2', icon: '❌', clientAction: 'reupload' },
  aguardando_assinatura:   { label: 'Aguard. assinatura', color: '#7c3aed', bg: '#f5f3ff', icon: '✍️', clientAction: 'sign' },
  assinado:                { label: 'Assinado',          color: '#16a34a', bg: '#f0fdf4', icon: '🔏', clientAction: null },
  arquivado:               { label: 'Arquivado',         color: '#6b7280', bg: '#f9fafb', icon: '📦', clientAction: null },
};

// ── Document Categories ────────────────────────────────────────────────────────
export const DOCUMENT_CATEGORIES = {
  identidade:     { label: 'Identidade',      icon: '🪪', color: '#2E6DA4' },
  residencia:     { label: 'Residência',      icon: '🏠', color: '#0891b2' },
  financeiro:     { label: 'Financeiro',      icon: '💰', color: '#16a34a' },
  dividas:        { label: 'Dívidas',         icon: '💳', color: '#dc2626' },
  contratos:      { label: 'Contratos',       icon: '📋', color: '#7c3aed' },
  assinatura:     { label: 'Assinatura',      icon: '✍️', color: '#d97706' },
  cnj:            { label: 'CNJ',             icon: '⚖️', color: '#1A3A5C' },
  judiciais:      { label: 'Judiciais',       icon: '🏛️', color: '#1A3A5C' },
  complementares: { label: 'Complementares',  icon: '📁', color: '#6b7280' },
};

// ── Document Types (extends legacy DOCUMENT_TYPES) ────────────────────────────
export const DOCUMENT_TYPE_MAP = {
  rg_cnh:                    { label: 'RG ou CNH',                     category: 'identidade',  required: true,  icon: '🪪' },
  cpf:                       { label: 'CPF',                           category: 'identidade',  required: true,  icon: '🪪' },
  comprovante_residencia:    { label: 'Comprovante de residência',     category: 'residencia',  required: true,  icon: '🏠' },
  comprovante_renda:         { label: 'Comprovante de renda',         category: 'financeiro',  required: true,  icon: '💰' },
  extratos_bancarios:        { label: 'Extratos bancários (3 meses)', category: 'financeiro',  required: true,  icon: '🏦' },
  contratos_dividas:         { label: 'Contratos de dívidas',        category: 'dividas',     required: false, icon: '💳' },
  correspondencias_cobranca: { label: 'Correspondências de cobrança', category: 'dividas',     required: false, icon: '📬' },
};

export class DocumentEngine {
  constructor() {
    this._docs      = [];
    this._requests  = [];
    this._service   = null;
    this._loaded    = false;
  }

  // ── Init ─────────────────────────────────────────────────────────────────────
  async init(documentService) {
    this._service = documentService;
    await this.load();
  }

  // ── Load ─────────────────────────────────────────────────────────────────────
  async load() {
    try {
      const rows = await this._service.list();

      // 1. Merge canonical types with DB rows
      const templateDocs = Object.entries(DOCUMENT_TYPE_MAP).map(([tipo, meta]) => {
        const row = rows.find(r => r.tipo === tipo) || {};
        return {
          ...meta, tipo,
          id:               row.id,
          status:           row.status           || 'pendente',
          workflow_status:  row.workflow_status  || 'pendente_envio',
          category:         row.category         || meta.category,
          storage_path:     row.storage_path     || null,
          nome_arquivo:     row.nome_arquivo     || null,
          observacao_admin: row.observacao_admin || null,
          admin_notes:      row.admin_notes      || null,
          deadline:         row.deadline         || null,
          require_signature: row.require_signature || false,
          autentique_id:    row.autentique_id    || null,
          autentique_status: row.autentique_status || null,
          version:          row.version          || 1,
          file_size:        row.file_size        || null,
          mime_type:        row.mime_type        || null,
          direction:        row.direction        || 'client_to_office',
          tags:             row.tags             || [],
          updated_at:       row.updated_at       || null,
          uploaded_by:      row.uploaded_by      || null,
        };
      });

      // 2. Append DB-only docs (office → client, or custom types not in template)
      const templateTipos = new Set(Object.keys(DOCUMENT_TYPE_MAP));
      const extraDocs = rows
        .filter(r => !templateTipos.has(r.tipo))
        .map(r => ({
          tipo:             r.tipo,
          label:            r.nome_arquivo || r.tipo,
          icon:             r.direction === 'office_to_client' ? '📨' : '📄',
          category:         r.category || 'contratos',
          required:         false,
          id:               r.id,
          status:           r.status,
          workflow_status:  r.workflow_status || 'enviado',
          storage_path:     r.storage_path,
          nome_arquivo:     r.nome_arquivo,
          observacao_admin: r.observacao_admin,
          admin_notes:      r.admin_notes,
          deadline:         r.deadline,
          require_signature: r.require_signature || false,
          autentique_id:    r.autentique_id,
          autentique_status: r.autentique_status,
          version:          r.version || 1,
          file_size:        r.file_size,
          mime_type:        r.mime_type,
          direction:        r.direction || 'client_to_office',
          tags:             r.tags || [],
          updated_at:       r.updated_at,
          uploaded_by:      r.uploaded_by,
        }));

      this._docs   = [...templateDocs, ...extraDocs];
      this._loaded = true;
      bus.emit('document.list.changed', { docs: this._docs });
    } catch (e) {
      console.error('[DocumentEngine] load error:', e);
      this._docs = [];
    }
    return this._docs;
  }

  async loadRequests() {
    try {
      this._requests = await this._service.listRequests?.() || [];
    } catch { this._requests = []; }
    return this._requests;
  }

  // ── Getters ───────────────────────────────────────────────────────────────────
  getAll()      { return this._docs; }
  getRequests() { return this._requests; }

  getByCategory(cat) {
    return this._docs.filter(d => d.category === cat);
  }

  getByStatus(ws) {
    return this._docs.filter(d => d.workflow_status === ws);
  }

  getPending() {
    return this._docs.filter(d =>
      ['pendente_envio','pendente_correcao','rejeitado'].includes(d.workflow_status)
    );
  }

  getAwaitingSignature() {
    return this._docs.filter(d => d.workflow_status === 'aguardando_assinatura');
  }

  getStats() {
    const total    = this._docs.length;
    const approved = this._docs.filter(d => d.workflow_status === 'aprovado' || d.workflow_status === 'assinado').length;
    const pending  = this._docs.filter(d => ['pendente_envio','pendente_correcao','rejeitado'].includes(d.workflow_status)).length;
    const inReview = this._docs.filter(d => ['enviado','recebido','em_analise'].includes(d.workflow_status)).length;
    const sigPend  = this._docs.filter(d => d.workflow_status === 'aguardando_assinatura').length;
    const progress = total > 0 ? Math.round((approved / total) * 100) : 0;
    return { total, approved, pending, inReview, sigPend, progress };
  }

  // ── Upload ────────────────────────────────────────────────────────────────────
  async upload(tipo, file, opts = {}) {
    const result = await this._service.upload(tipo, file);
    await this.load(); // refresh

    const doc = this._docs.find(d => d.tipo === tipo);
    bus.emit('document.created',      { tipo, doc, file: { name: file.name, size: file.size } });
    bus.emit('document.list.changed', { docs: this._docs });

    // Log to timeline via service
    await this._logTimeline(doc?.id, 'document.enviado', 'upload', {
      tipo, nome_arquivo: file.name, file_size: file.size,
      context: opts.context || 'client_upload',
    });

    return result;
  }

  // ── Admin Actions ─────────────────────────────────────────────────────────────
  async approve(docId, notes = null, adminNotes = null) {
    return this._adminWorkflow(docId, 'aprovado', notes, adminNotes);
  }

  async reject(docId, notes = null, adminNotes = null) {
    return this._adminWorkflow(docId, 'rejeitado', notes, adminNotes);
  }

  async requestCorrection(docId, notes = null) {
    return this._adminWorkflow(docId, 'pendente_correcao', notes);
  }

  async markInAnalysis(docId) {
    return this._adminWorkflow(docId, 'em_analise');
  }

  async archive(docId) {
    return this._adminWorkflow(docId, 'arquivado');
  }

  async _adminWorkflow(docId, workflowStatus, notes = null, adminNotes = null) {
    const result = await this._service.adminUpdateWorkflow(docId, workflowStatus, notes, adminNotes);
    await this.load();

    const eventMap = {
      aprovado:            'document.approved',
      rejeitado:           'document.rejected',
      pendente_correcao:   'document.updated',
      em_analise:          'document.updated',
      arquivado:           'document.archived',
    };

    bus.emit(eventMap[workflowStatus] || 'document.updated', {
      docId, workflowStatus, notes
    });
    bus.emit('document.list.changed', { docs: this._docs });
    return result;
  }

  // ── Timeline ──────────────────────────────────────────────────────────────────
  async _logTimeline(documentId, eventoTipo, eventoSubtipo, payload = {}) {
    if (!documentId) return;
    try {
      await this._service.logTimeline?.({ documentId, eventoTipo, eventoSubtipo, payload });
    } catch (e) { console.warn('[DocumentEngine] timeline log error:', e); }
  }

  async getTimeline(documentId) {
    try {
      return await this._service.getDocTimeline?.(documentId) || [];
    } catch { return []; }
  }

  // ── Requests ──────────────────────────────────────────────────────────────────
  async fulfillRequest(requestId) {
    try {
      await this._service.fulfillRequest?.(requestId);
      await this.loadRequests();
    } catch (e) { console.warn('[DocumentEngine] fulfillRequest error:', e); }
  }

  // ── Signature ─────────────────────────────────────────────────────────────────
  async requestSignature(docId, signerEmail, signerName) {
    const doc = this._docs.find(d => d.id === docId);
    if (!doc) throw new Error('Documento não encontrado');

    // Update to awaiting signature state
    await this._adminWorkflow(docId, 'aguardando_assinatura');

    bus.emit('signature.requested', { docId, signerEmail, signerName, doc });

    // Log timeline
    await this._logTimeline(docId, 'signature.requested', 'admin_action', {
      signerEmail, signerName,
    });

    return { docId, signerEmail, status: 'aguardando_assinatura' };
  }

  async markSigned(docId) {
    await this._adminWorkflow(docId, 'assinado');
    bus.emit('signature.completed', { docId });
    await this._logTimeline(docId, 'signature.completed', 'webhook', {});
  }
}
