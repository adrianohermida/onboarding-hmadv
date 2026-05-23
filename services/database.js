import { supabase } from './supabase.js';
import { normalizeCaseData, normalizeAdminClientRows } from './data-contracts.js';

export const DOCUMENT_TYPES = [
  { tipo: 'rg_cnh',                    label: 'RG ou CNH (frente e verso)',   categoria: 'Identidade', obrigatorio: true },
  { tipo: 'cpf',                       label: 'CPF',                          categoria: 'Identidade', obrigatorio: true },
  { tipo: 'comprovante_residencia',    label: 'Comprovante de residência',    categoria: 'Residência', obrigatorio: true },
  { tipo: 'comprovante_renda',         label: 'Comprovante de renda',         categoria: 'Financeiro', obrigatorio: true },
  { tipo: 'extratos_bancarios',        label: 'Extratos bancários (3 meses)', categoria: 'Financeiro', obrigatorio: true },
  { tipo: 'contratos_dividas',         label: 'Contratos de dívidas',         categoria: 'Dívidas',    obrigatorio: false },
  { tipo: 'correspondencias_cobranca', label: 'Correspondências de cobrança', categoria: 'Dívidas',    obrigatorio: false },
];

async function getUserId() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Usuário não autenticado');
  return user.id;
}

async function getCaseContext(uid) {
  const { data: caso, error } = await supabase
    .from('portal_casos')
    .select('id, workspace_id')
    .eq('user_id', uid)
    .maybeSingle();
  if (error) throw error;
  return {
    casoId: caso?.id ?? null,
    workspaceId: caso?.workspace_id ?? null,
  };
}

async function getLatestCaseRow(uid, select = '*') {
  // Primary path: newest row by updated_at.
  const primary = await supabase
    .from('portal_casos')
    .select(select)
    .eq('user_id', uid)
    .order('updated_at', { ascending: false })
    .limit(1);

  if (!primary.error) return primary.data?.[0] ?? null;

  // Compatibility fallback: environments with schema drift may miss updated_at.
  const fallbackCreatedAt = await supabase
    .from('portal_casos')
    .select(select)
    .eq('user_id', uid)
    .order('created_at', { ascending: false })
    .limit(1);

  if (!fallbackCreatedAt.error) return fallbackCreatedAt.data?.[0] ?? null;

  // Last-resort fallback without ordering avoids hard failures and 409 loops.
  const fallbackNoOrder = await supabase
    .from('portal_casos')
    .select(select)
    .eq('user_id', uid)
    .limit(1);

  if (fallbackNoOrder.error) throw fallbackNoOrder.error;
  return fallbackNoOrder.data?.[0] ?? null;
}

async function saveCaseByUser(uid, fields = {}) {
  const existing = await getLatestCaseRow(uid, 'id').catch(() => null);
  if (existing?.id) {
    const { data, error } = await supabase
      .from('portal_casos')
      .update(fields)
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from('portal_casos')
    .insert({ user_id: uid, ...fields })
    .select()
    .single();
  if (error) {
    // Concurrency/race safe: another request may have created the row first.
    if (error.code === '23505' || error.status === 409) {
      const winner = await getLatestCaseRow(uid, '*').catch(() => null);
      if (winner) return winner;
    }
    throw error;
  }
  return data;
}

export async function checkIsAdmin() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: isAdminRpc, error: rpcError } = await supabase.rpc('is_any_admin');
  if (!rpcError && typeof isAdminRpc === 'boolean') return isAdminRpc;

  // Fallback de compatibilidade: usuário interno de workspace também deve
  // conseguir operar os módulos administrativos do shell.
  const { data: memberRow } = await supabase
    .from('portal_workspace_members')
    .select('role')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .in('role', ['owner', 'admin', 'advogado', 'colaborador', 'financeiro'])
    .limit(1)
    .maybeSingle();
  if (memberRow) return true;

  const { data } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();
  return !!data;
}

export const AdminService = {
  async getStats() {
    const { data, error } = await supabase.rpc('admin_get_stats');
    if (error) throw error;
    // RPC may return array (single row) or object — normalise to object
    const row = Array.isArray(data) ? (data[0] ?? {}) : (data ?? {});
    return row;
  },
  async getClients() {
    const mapCasesToAdminRows = (casos = []) => normalizeAdminClientRows((casos || []).map((c) => ({
      user_id: c.user_id,
      email: null,
      full_name: c.full_name,
      cpf: c.cpf || null,
      fase: c.fase,
      onboarding_done: c.onboarding_done,
      cnj_step_atual: c.cnj_step_atual || null,
      n_credores: c.n_credores || 0,
      fd_ticket_id: c.fd_ticket_id || null,
      workspace_id: c.workspace_id || null,
      workspace_slug: null,
      total_dividas: 0,
      docs_aprovados: 0,
      docs_pendentes: 0,
      created_at: c.created_at,
    })));

    const queryFallbackCases = async () => {
      const { data: casos, error: casosError } = await supabase
        .from('portal_casos')
        .select('user_id, full_name, cpf, fase, onboarding_done, cnj_step_atual, n_credores, fd_ticket_id, workspace_id, created_at, updated_at')
        .order('created_at', { ascending: false });

      if (!casosError) {
        return mapCasesToAdminRows(casos);
      }

      // Fallback extra: alguns ambientes podem nao ter todas as colunas acima.
      // Nesse caso, usamos uma selecao minima para manter o dashboard funcional.
      console.warn('[AdminService.getClients] full fallback query failed, trying minimal query:', casosError);

      const { data: casosMin, error: casosMinError } = await supabase
        .from('portal_casos')
        .select('user_id, full_name, fase, onboarding_done, created_at, updated_at')
        .order('created_at', { ascending: false });

      if (!casosMinError) {
        return mapCasesToAdminRows(casosMin);
      }

      // Ultima protecao: nao quebrar a tela admin por divergencia de ambiente.
      console.warn('[AdminService.getClients] minimal fallback query failed; returning empty list:', casosMinError);
      return [];
    };

    const skipRpc = sessionStorage.getItem('portal:rpc-admin-get-clients-broken') === '1';
    if (skipRpc) {
      return queryFallbackCases();
    }

    const { data, error } = await supabase.rpc('admin_get_clients');
    if (!error) return normalizeAdminClientRows(data || []);

    // Fallback de compatibilidade: quando o RPC nao existe/falha no projeto remoto,
    // carregamos os casos diretamente para manter o painel admin operacional.
    console.warn('[AdminService.getClients] RPC admin_get_clients failed, using fallback query:', error);

    if (error?.code === '42702') {
      sessionStorage.setItem('portal:rpc-admin-get-clients-broken', '1');
    }

    return queryFallbackCases();
  },
  async getClientCaso(userId) {
    const data = await getLatestCaseRow(userId, '*');
    return normalizeCaseData(data);
  },
  async getClientDebts(userId) {
    const { data, error } = await supabase
      .from('portal_dividas').select('*').eq('user_id', userId).order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  },
  async getClientDocs(userId) {
    const { data, error } = await supabase
      .from('portal_documentos').select('*').eq('user_id', userId);
    if (error) throw error;
    return data || [];
  },

  async getInternalUsers() {
    const fromProfiles = await supabase
      .from('admin_profiles')
      .select('id, email, full_name, role, is_active')
      .eq('is_active', true)
      .order('full_name', { ascending: true });

    if (!fromProfiles.error) {
      return (fromProfiles.data || []).map((item) => ({
        id: item.id,
        name: item.full_name || item.email || 'Usuário interno',
        email: item.email || '',
        role: item.role || 'admin',
      }));
    }

    const { data, error } = await supabase
      .from('admin_users')
      .select('user_id, role')
      .order('created_at', { ascending: false });
    if (error) throw error;

    return (data || []).map((item) => ({
      id: item.user_id,
      name: item.user_id,
      email: '',
      role: item.role || 'admin',
    }));
  },

  async sendClientInvite({ email, userId = null, workspaceId = null, redirectTo = null }) {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail) throw new Error('E-mail do cliente é obrigatório para enviar convite.');

    const invitedBy = await getUserId().catch(() => null);
    if (userId && workspaceId) {
      await AdminService.ensureClientWorkspaceMember({
        userId,
        workspaceId,
        invitedBy,
      });
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        emailRedirectTo: redirectTo || window.location.origin,
        shouldCreateUser: true,
      },
    });

    if (error) throw error;
    return { ok: true };
  },

  async ensureClientWorkspaceMember({ userId, workspaceId, invitedBy = null }) {
    if (!userId || !workspaceId) return { ok: false, skipped: true };
    const { error } = await supabase
      .from('portal_workspace_members')
      .upsert({
        workspace_id: workspaceId,
        user_id: userId,
        role: 'member',
        is_active: true,
        invited_by: invitedBy || null,
      }, { onConflict: 'workspace_id,user_id' });

    if (error) throw error;
    return { ok: true };
  },

  async resetClientJourney(userId) {
    const nowIso = new Date().toISOString();
    await saveCaseByUser(userId, {
      onboarding_done: false,
      cnj_step_atual: 0,
      fd_ticket_id: null,
      cnj_json: null,
      updated_at: nowIso,
    });

    const { error } = await supabase
      .from('portal_documentos')
      .update({
        workflow_status: null,
        status: null,
        storage_path: null,
        admin_notes: null,
        updated_at: nowIso,
      })
      .eq('user_id', userId)
      .in('tipo', ['formulario_cnj_online', 'formulario_cnj_anexo_ii']);

    if (error) throw error;
    return true;
  },
};

export const CaseService = {
  async get() {
    const uid = await getUserId();
    // Prefer a controlled column list to reduce breakage when environments drift.
    const safeSelect = [
      'id',
      'user_id',
      'workspace_id',
      'full_name',
      'fase',
      'onboarding_done',
      'numero_processo',
      'cnj_step_atual',
      'renda_mensal',
      'renda_familiar',
      'numero_dependentes',
      'despesas_json',
      'created_at',
      'updated_at',
    ].join(', ');
    try {
      const data = await getLatestCaseRow(uid, safeSelect);
      return normalizeCaseData(data);
    } catch (_) {
      // Compatibility fallback for databases missing some columns from safeSelect.
      const data = await getLatestCaseRow(uid, 'id, user_id, full_name, fase, onboarding_done, created_at, updated_at');
      return normalizeCaseData(data);
    }
  },

  async ensureExists() {
    const uid = await getUserId();
    const existingCaso = await getLatestCaseRow(uid, 'id').catch(() => null);
    if (!existingCaso?.id) {
      const { error } = await supabase
        .from('portal_casos')
        .insert({ user_id: uid });
      // 23505/409 can happen on parallel boots; treat as already-created.
      if (error && error.code !== '23505' && error.status !== 409) throw error;
    }
    await supabase
      .from('portal_documentos')
      .upsert(
        DOCUMENT_TYPES.map(d => ({ user_id: uid, tipo: d.tipo })),
        { onConflict: 'user_id,tipo', ignoreDuplicates: true }
      );
  },

  async save(fields) {
    const uid = await getUserId();
    const data = await saveCaseByUser(uid, fields);
    return normalizeCaseData(data);
  },

  /** Salva step CNJ e atualiza cnj_step_atual se avançou */
  async saveCNJStep(step, fields) {
    const uid = await getUserId();
    const data = await saveCaseByUser(uid, {
      ...fields,
      cnj_step_atual: step,
    });
    return normalizeCaseData(data);
  },
};

export const DebtService = {
  async list() {
    const uid = await getUserId();
    const { data, error } = await supabase
      .from('portal_dividas')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async add(debt) {
    const uid = await getUserId();
    const { data, error } = await supabase
      .from('portal_dividas')
      .insert({ ...debt, user_id: uid })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, fields) {
    const uid = await getUserId();
    const { data, error } = await supabase
      .from('portal_dividas')
      .update(fields)
      .eq('id', id)
      .eq('user_id', uid)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async remove(id) {
    const uid = await getUserId();
    const { error } = await supabase
      .from('portal_dividas')
      .delete()
      .eq('id', id)
      .eq('user_id', uid);
    if (error) throw error;
  },
};

export const DocumentService = {
  TYPES: DOCUMENT_TYPES,

  async list() {
    const uid = await getUserId();
    const { data, error } = await supabase
      .from('portal_documentos')
      .select('*')
      .eq('user_id', uid)
      .is('deleted_at', null);
    if (error) throw error;
    return data || [];
  },

  async upload(tipo, file) {
    const uid  = await getUserId();
    const ext  = file.name.split('.').pop();
    const { data: caso } = await supabase
      .from('portal_casos')
      .select('id, workspace_id')
      .eq('user_id', uid)
      .maybeSingle();
    const typeMeta = DOCUMENT_TYPES.find(d => d.tipo === tipo);
    const category = (typeMeta?.categoria || 'uploads')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/[^a-z0-9_-]+/g, '-');
    const tenantSegment = caso?.workspace_id || 'default-tenant';
    const path = `${tenantSegment}/${uid}/documents/${category}/${tipo}/${Date.now()}.${ext}`;

    const { data, error } = await supabase.storage
      .from('portal-documentos')
      .upload(path, file, { upsert: true });
    if (error) throw error;

    // Upsert document record with enterprise fields
    const { error: dbErr } = await supabase
      .from('portal_documentos')
      .upsert({
        user_id:         uid,
        tipo,
        caso_id:         caso?.id ?? null,
        workspace_id:    caso?.workspace_id ?? null,
        category,
        status:          'em_analise',
        workflow_status: 'em_analise',
        storage_path:    data.path,
        nome_arquivo:    file.name,
        file_size:       file.size,
        mime_type:       file.type,
        direction:       'client_to_office',
        uploaded_by:     uid,
        updated_at:      new Date().toISOString(),
      }, { onConflict: 'user_id,tipo' });
    if (dbErr) throw dbErr;

    return data;
  },

  async getSignedUrl(storagePath, expiresIn = 3600) {
    const { data, error } = await supabase.storage
      .from('portal-documentos')
      .createSignedUrl(storagePath, expiresIn);
    if (error) throw error;
    return data.signedUrl;
  },

  async adminUpdateWorkflow(docId, workflowStatus, notes = null, adminNotes = null) {
    const { data, error } = await supabase.rpc('admin_update_doc_workflow', {
      p_doc_id:          docId,
      p_workflow_status: workflowStatus,
      p_observacao:      notes,
      p_admin_notes:     adminNotes,
    });
    if (error) throw error;
    return data;
  },

  // Legacy admin_update_doc_status compatibility
  async adminUpdateStatus(docId, status, observacao = null) {
    const wfMap = {
      aprovado:   'aprovado',
      recusado:   'rejeitado',
      em_analise: 'em_analise',
    };
    return this.adminUpdateWorkflow(docId, wfMap[status] || status, observacao);
  },

  async getDocTimeline(documentId) {
    const { data, error } = await supabase
      .from('portal_cnj_timeline')
      .select('*')
      .eq('documento_id', documentId)
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) throw error;
    return data || [];
  },

  async listComments(documentId, { includeInternal = false } = {}) {
    let query = supabase
      .from('portal_document_comments')
      .select('*')
      .eq('documento_id', documentId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!includeInternal) query = query.eq('is_internal', false);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async addComment(documentId, body, { isInternal = false, authorRole = 'cliente' } = {}) {
    const uid = await getUserId().catch(() => null);
    const { data: doc, error: docError } = await supabase
      .from('portal_documentos')
      .select('id, caso_id, workspace_id')
      .eq('id', documentId)
      .maybeSingle();
    if (docError) throw docError;
    if (!doc?.id) throw new Error('Documento não encontrado');

    const { data, error } = await supabase
      .from('portal_document_comments')
      .insert({
        documento_id: documentId,
        caso_id: doc.caso_id,
        workspace_id: doc.workspace_id,
        author_uid: uid,
        author_role: authorRole,
        body,
        is_internal: isInternal,
      })
      .select()
      .single();
    if (error) throw error;

    await this.logTimeline({
      documentId,
      eventoTipo: 'document.comment',
      eventoSubtipo: isInternal ? 'internal_comment' : 'comment',
      payload: { comment_id: data.id, is_internal: isInternal, body },
    });

    return data;
  },

  async markViewed(documentId) {
    const { error } = await supabase
      .from('portal_documentos')
      .update({ last_viewed_at: new Date().toISOString() })
      .eq('id', documentId);
    if (error) console.warn('[DocumentService] markViewed error:', error.message);
  },

  async logTimeline({ documentId, eventoTipo, eventoSubtipo, payload = {} }) {
    const uid = await getUserId().catch(() => null);
    // Get caso_id from the document
    const { data: doc } = await supabase
      .from('portal_documentos')
      .select('caso_id, workspace_id')
      .eq('id', documentId)
      .maybeSingle();

    if (!doc?.caso_id) return;
    const { error } = await supabase
      .from('portal_cnj_timeline')
      .insert({
        caso_id:        doc.caso_id,
        workspace_id:   doc.workspace_id,
        documento_id:   documentId,
        evento_tipo:    eventoTipo,
        evento_subtipo: eventoSubtipo,
        descricao:      `Documento: ${eventoTipo}`,
        payload,
        author_uid:     uid,
        is_visible_client: true,
      });
    if (error) console.warn('[DocumentService] logTimeline error:', error.message);
  },

  async listRequests() {
    const uid = await getUserId();
    const { data, error } = await supabase
      .from('portal_document_requests')
      .select('*')
      .eq('user_id', uid)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async fulfillRequest(requestId) {
    const { error } = await supabase
      .from('portal_document_requests')
      .update({ status: 'fulfilled', fulfilled_at: new Date().toISOString() })
      .eq('id', requestId);
    if (error) throw error;
  },

  // Admin: list docs for a specific user
  async listForUser(userId) {
    const { data, error } = await supabase
      .from('portal_documentos')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null);
    if (error) throw error;
    return data || [];
  },

  // Admin: create document request
  async createRequest(fields) {
    const { data, error } = await supabase
      .from('portal_document_requests')
      .insert(fields)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

export const CustasService = {
  async list() {
    const uid = await getUserId();
    const { data, error } = await supabase
      .from('portal_custas')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false });
    if (error) throw error;
    const rows = (data || []).filter(item => !item?.deleted_at);
    rows.sort((a, b) => {
      const ad = new Date(a?.data_lancamento || a?.created_at || 0).getTime();
      const bd = new Date(b?.data_lancamento || b?.created_at || 0).getTime();
      return bd - ad;
    });
    return rows;
  },

  async add(entry) {
    const uid = await getUserId();
    const { casoId, workspaceId } = await getCaseContext(uid);
    const payload = {
      ...entry,
      user_id: uid,
      caso_id: casoId,
      workspace_id: workspaceId,
    };
    const { data, error } = await supabase
      .from('portal_custas')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, fields) {
    const uid = await getUserId();
    const { data, error } = await supabase
      .from('portal_custas')
      .update(fields)
      .eq('id', id)
      .eq('user_id', uid)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async remove(id) {
    const uid = await getUserId();
    const { error } = await supabase
      .from('portal_custas')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', uid);
    if (error) throw error;
  },
};

export const ContratosService = {
  async list() {
    const uid = await getUserId();
    const { data, error } = await supabase
      .from('portal_contratos')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false });
    if (error) throw error;
    const rows = (data || []).filter(item => !item?.deleted_at);
    rows.sort((a, b) => {
      const ad = new Date(a?.updated_at || a?.created_at || 0).getTime();
      const bd = new Date(b?.updated_at || b?.created_at || 0).getTime();
      return bd - ad;
    });
    return rows;
  },

  async add(entry) {
    const uid = await getUserId();
    const { casoId, workspaceId } = await getCaseContext(uid);
    const payload = {
      ...entry,
      user_id: uid,
      caso_id: casoId,
      workspace_id: workspaceId,
    };
    const { data, error } = await supabase
      .from('portal_contratos')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, fields) {
    const uid = await getUserId();
    const { data, error } = await supabase
      .from('portal_contratos')
      .update(fields)
      .eq('id', id)
      .eq('user_id', uid)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async remove(id) {
    const uid = await getUserId();
    const { error } = await supabase
      .from('portal_contratos')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', uid);
    if (error) throw error;
  },
};

export const PlanoPagamentoService = {
  async list() {
    const uid = await getUserId();
    const { data, error } = await supabase
      .from('portal_planos_pagamento')
      .select('*')
      .eq('user_id', uid)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async upsertFromProposal(proposal = {}, metadata = {}) {
    const uid = await getUserId();
    const { casoId, workspaceId } = await getCaseContext(uid);
    const payload = {
      user_id: uid,
      caso_id: casoId,
      workspace_id: workspaceId,
      titulo: metadata.titulo || 'Plano sugerido',
      status: metadata.status || 'em_analise',
      valor_total: Number(proposal.saldoNegociado || 0),
      parcela_sugerida: Number(proposal.parcelaSugerida || 0),
      prazo_meses: Number(proposal.prazoMeses || 0),
      observacao: proposal.observacao || null,
      cronograma: Array.isArray(metadata.cronograma) ? metadata.cronograma : [],
      source: metadata.source || 'portal_cliente',
      metadata: metadata.metadata || {},
    };

    const { data, error } = await supabase
      .from('portal_planos_pagamento')
      .upsert(payload, { onConflict: 'user_id,titulo', ignoreDuplicates: false })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, fields) {
    const uid = await getUserId();
    const { data, error } = await supabase
      .from('portal_planos_pagamento')
      .update(fields)
      .eq('id', id)
      .eq('user_id', uid)
      .is('deleted_at', null)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async remove(id) {
    const uid = await getUserId();
    const { error } = await supabase
      .from('portal_planos_pagamento')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', uid)
      .is('deleted_at', null);
    if (error) throw error;
  },
};

// ─── VideoService ─────────────────────────────────────────────────────────────
export const VideoService = {
  /** Busca todos os vídeos ativos da jornada CNJ, ordenados */
  async listVideos() {
    const { data, error } = await supabase
      .from('onboarding_videos')
      .select('*')
      .eq('is_active', true)
      .order('step_order', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  /** Busca o progresso do usuário autenticado para todos os vídeos */
  async listProgress() {
    const uid = await getUserId();
    const { data, error } = await supabase
      .from('onboarding_video_progress')
      .select('*, onboarding_videos(step_key, allow_skip, skip_min_pct)')
      .eq('user_id', uid);
    if (error) throw error;
    return data || [];
  },

  /** Cria ou atualiza o progresso de um vídeo específico */
  async upsertProgress(videoId, fields) {
    const uid = await getUserId();

    // Busca caso para preencher caso_id / workspace_id
    const { data: caso } = await supabase
      .from('portal_casos')
      .select('id, workspace_id')
      .eq('user_id', uid)
      .maybeSingle();

    const payload = {
      user_id:      uid,
      video_id:     videoId,
      caso_id:      caso?.id      ?? null,
      workspace_id: caso?.workspace_id ?? null,
      last_watched_at: new Date().toISOString(),
      ...fields,
    };

    // Garante que max_pct_reached não regride
    if (fields.watch_pct !== undefined) {
      payload.max_pct_reached = fields.watch_pct; // será tratado pelo trigger/upsert
    }

    const { data, error } = await supabase
      .from('onboarding_video_progress')
      .upsert(payload, { onConflict: 'user_id,video_id' })
      .select()
      .single();
    if (error) throw error;

    // Garante max_pct_reached nunca diminui (update separado se necessário)
    if (fields.watch_pct !== undefined) {
      await supabase.rpc('rpc_update_max_pct_if_higher', {
        p_user_id:  uid,
        p_video_id: videoId,
        p_pct:      fields.watch_pct,
      }).maybeSingle(); // ignora erro se RPC não existir ainda
    }

    return data;
  },

  /** Marca vídeo como concluído */
  async markCompleted(videoId) {
    return this.upsertProgress(videoId, {
      status:       'completed',
      watch_pct:    100,
      completed_at: new Date().toISOString(),
    });
  },

  /** Marca vídeo como pulado (com declaração obrigatória) */
  async markSkipped(videoId, reason) {
    return this.upsertProgress(videoId, {
      status:         'skipped',
      skip_declared:  true,
      skip_reason:    reason || 'Declarou ter assistido externamente',
      skipped_at:     new Date().toISOString(),
    });
  },
};

// ─── DownloadAuditService ─────────────────────────────────────────────────────
export const DownloadAuditService = {
  /**
   * Registra um download no audit log via RPC SECURITY DEFINER.
   * @param {string}  assetKey        - ex: 'cartilha_superendividamento'
   * @param {string}  assetLabel      - ex: 'Cartilha Superendividamento CNJ'
   * @param {object}  [opts]          - opções extras
   */
  async log(assetKey, assetLabel, opts = {}) {
    try {
      const { data, error } = await supabase.rpc('rpc_log_download', {
        p_asset_key:       assetKey,
        p_asset_type:      opts.assetType      ?? 'pdf',
        p_asset_label:     assetLabel          ?? assetKey,
        p_asset_version:   opts.assetVersion   ?? null,
        p_cnj_step_ref:    opts.cnjStepRef     ?? null,
        p_journey_context: opts.journeyContext ?? 'onboarding',
        p_metadata:        opts.metadata       ?? {},
      });
      if (error) console.warn('[DownloadAudit] log error:', error.message);
      return data; // retorna o UUID do registro
    } catch (e) {
      console.warn('[DownloadAudit] exception:', e);
      return null;
    }
  },

  /** Abre um URL de download e registra no audit */
  async downloadAndLog(url, assetKey, assetLabel, opts = {}) {
    // Primeiro registra, depois inicia download
    await this.log(assetKey, assetLabel, opts);
    const a = document.createElement('a');
    a.href = url;
    a.download = opts.filename ?? assetLabel ?? assetKey;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  },
};
