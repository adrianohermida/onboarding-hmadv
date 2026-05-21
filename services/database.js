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
    return data;
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
