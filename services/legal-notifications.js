import { supabase } from './supabase.js';

export const LEGAL_NOTIFICATION_TYPES = {
  intimacao:    { label: 'Intimações',   tone: 'warn',  icon: 'scale' },
  solicitacao:  { label: 'Solicitações', tone: 'brand', icon: 'file-text' },
  orcamento:    { label: 'Orçamentos',   tone: 'ok',    icon: 'receipt' },
  notificacao:  { label: 'Notificações', tone: 'brand', icon: 'bell' },
  assinatura:   { label: 'Assinaturas',  tone: 'warn',  icon: 'pen' },
};

export const LEGAL_NOTIFICATION_STATUSES = {
  nao_lido:              { label: 'Não lido',               tone: 'danger' },
  lido:                  { label: 'Lido',                   tone: 'muted' },
  assinado:              { label: 'Assinado',               tone: 'ok' },
  pendente_assinatura:   { label: 'Pendente de assinatura', tone: 'warn' },
  aprovado:              { label: 'Aprovado',               tone: 'ok' },
  pendente:              { label: 'Pendente',               tone: 'warn' },
  recusado:              { label: 'Recusado',               tone: 'danger' },
};

function normalizeNotification(row = {}) {
  const read = Boolean(row.read_at || row.lida || row.read);
  const rawStatus = row.interaction_status || row.status || (read ? 'lido' : 'nao_lido');
  const status = read && rawStatus === 'nao_lido' ? 'lido' : rawStatus;
  return {
    id: row.id,
    type: row.interaction_type || row.type || row.tipo || 'notificacao',
    status,
    title: row.title || row.titulo || row.assunto || 'Notificação',
    text: row.body_text || row.body || row.mensagem || row.corpo_texto || '',
    createdAt: row.created_at || row.criada_em || new Date().toISOString(),
    readAt: row.read_at || null,
    requiresAck: Boolean(row.requires_ack),
    requiresComment: Boolean(row.requires_comment),
    requiresSignature: Boolean(row.requires_signature),
    documentId: row.document_id || null,
    caseId: row.case_id || row.caso_id || null,
    metadata: row.legal_metadata || row.metadata || {},
  };
}

function sortByCreatedDesc(a, b) {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

export const LegalNotificationService = {
  TYPES: LEGAL_NOTIFICATION_TYPES,
  STATUSES: LEGAL_NOTIFICATION_STATUSES,

  async list({ limit = 80 } = {}) {
    const { data, error } = await supabase
      .from('portal_cnj_notifications')
      .select('id,workspace_id,caso_id,recipient_uid,recipient_email,interaction_type,interaction_status,assunto,corpo_texto,requires_ack,requires_comment,requires_signature,document_id,read_at,created_at,legal_metadata')
      .eq('canal', 'portal')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).map(normalizeNotification).sort(sortByCreatedDesc);
  },

  async markRead(id) {
    if (!id) return null;
    const { data, error } = await supabase.rpc('mark_portal_notification_read', {
      p_notification_id: id,
    });

    if (error) throw error;
    return data;
  },

  normalizeLocal(items = []) {
    return (items || []).map(item => normalizeNotification({
      id: item.id,
      type: item.type || 'notificacao',
      status: item.read ? 'lido' : 'nao_lido',
      title: item.title,
      body_text: item.text,
      created_at: item.ts ? new Date(item.ts).toISOString() : new Date().toISOString(),
      read_at: item.read ? new Date(item.ts || Date.now()).toISOString() : null,
      metadata: { source: 'session' },
    })).sort(sortByCreatedDesc);
  },
};
