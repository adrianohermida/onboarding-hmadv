import { supabase } from './supabase.js';

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

export async function checkIsAdmin() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
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
    const { data, error } = await supabase.rpc('admin_get_clients');
    if (error) throw error;
    return data || [];
  },
  async getClientCaso(userId) {
    const { data, error } = await supabase
      .from('portal_casos').select('*').eq('user_id', userId).maybeSingle();
    if (error) throw error;
    return data;
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
};

export const CaseService = {
  async get() {
    const uid = await getUserId();
    const { data, error } = await supabase
      .from('portal_casos')
      .select('*')
      .eq('user_id', uid)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async ensureExists() {
    const uid = await getUserId();
    await supabase
      .from('portal_casos')
      .upsert({ user_id: uid }, { onConflict: 'user_id', ignoreDuplicates: true });
    await supabase
      .from('portal_documentos')
      .upsert(
        DOCUMENT_TYPES.map(d => ({ user_id: uid, tipo: d.tipo })),
        { onConflict: 'user_id,tipo', ignoreDuplicates: true }
      );
  },

  async save(fields) {
    const uid = await getUserId();
    const { data, error } = await supabase
      .from('portal_casos')
      .upsert({ ...fields, user_id: uid })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /** Salva step CNJ e atualiza cnj_step_atual se avançou */
  async saveCNJStep(step, fields) {
    const uid = await getUserId();
    const payload = {
      ...fields,
      user_id:        uid,
      cnj_step_atual: step,
    };
    const { data, error } = await supabase
      .from('portal_casos')
      .upsert(payload, { onConflict: 'user_id' })
      .select()
      .single();
    if (error) throw error;
    return data;
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

  async remove(id) {
    const { error } = await supabase
      .from('portal_dividas')
      .delete()
      .eq('id', id);
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
      .eq('user_id', uid);
    if (error) throw error;
    return data || [];
  },

  async upload(tipo, file) {
    const uid = await getUserId();
    const ext = file.name.split('.').pop();
    const path = `${uid}/${tipo}/${Date.now()}.${ext}`;

    const { data, error } = await supabase.storage
      .from('portal-documentos')
      .upload(path, file, { upsert: true });
    if (error) throw error;

    const { error: dbErr } = await supabase
      .from('portal_documentos')
      .update({ status: 'em_analise', storage_path: data.path, nome_arquivo: file.name })
      .eq('user_id', uid)
      .eq('tipo', tipo);
    if (dbErr) throw dbErr;

    return data;
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
