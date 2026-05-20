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

export const CaseService = {
  async get() {
    const { data, error } = await supabase
      .from('portal_casos')
      .select('*')
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
};

export const DebtService = {
  async list() {
    const { data, error } = await supabase
      .from('portal_dividas')
      .select('*')
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
    const { data, error } = await supabase
      .from('portal_documentos')
      .select('*');
    if (error) throw error;
    return data || [];
  },
};
