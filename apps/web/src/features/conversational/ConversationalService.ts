import type { SupabaseClient } from '@supabase/supabase-js';
import type { CrmConversation, CrmMessage, SendCrmMessageInput } from './types';

type RealtimeHandler<T> = (payload: T) => void;

export class ConversationalService {
  constructor(private readonly supabase: SupabaseClient) {}

  async listInbox(params: {
    tenantId?: string | null;
    search?: string;
    status?: string;
    assignedUserId?: string;
    limit?: number;
    cursor?: string | null;
  } = {}): Promise<CrmConversation[]> {
    let query = this.supabase
      .from('vw_crm_inbox')
      .select('*')
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .limit(params.limit ?? 40);

    if (params.tenantId) query = query.eq('tenant_id', params.tenantId);
    if (params.status && params.status !== 'all') query = query.eq('status', params.status);
    if (params.assignedUserId) query = query.eq('assigned_user_id', params.assignedUserId);
    if (params.cursor) query = query.lt('last_message_at', params.cursor);
    if (params.search?.trim()) {
      const term = `%${params.search.trim()}%`;
      query = query.or(`title.ilike.${term},contact_name.ilike.${term},last_message_preview.ilike.${term},case_client_name.ilike.${term},case_client_cpf.ilike.${term},numero_processo.ilike.${term}`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as CrmConversation[];
  }

  async ensurePortalConversation(params: {
    tenantId: string;
    currentUserId: string;
    title?: string;
    contactName?: string | null;
  }): Promise<CrmConversation> {
    const existing = await this.listInbox({ tenantId: params.tenantId, limit: 50 });
    const active = existing.find((item) =>
      item.contact_user_id === params.currentUserId &&
      item.channel === 'portal' &&
      !item.archived_at &&
      item.status !== 'archived',
    );
    if (active) return active;

    const { data, error } = await this.supabase
      .from('crm_conversations')
      .insert({
        tenant_id: params.tenantId,
        contact_user_id: params.currentUserId,
        contact_name: params.contactName ?? null,
        title: params.title ?? 'Atendimento do cliente',
        channel: 'portal',
        status: 'open',
        priority: 'normal',
        pipeline_stage: 'triagem',
      })
      .select('*')
      .single();

    if (error) throw error;
    return data as CrmConversation;
  }

  async listMessages(conversationId: string, params: { limit?: number; before?: string | null } = {}): Promise<CrmMessage[]> {
    let query = this.supabase
      .from('crm_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(params.limit ?? 60);

    if (params.before) query = query.lt('created_at', params.before);

    const { data, error } = await query;
    if (error) throw error;
    return [...((data ?? []) as CrmMessage[])].reverse();
  }

  async sendMessage(input: SendCrmMessageInput): Promise<CrmMessage> {
    const { data, error } = await this.supabase
      .from('crm_messages')
      .insert({
        id: input.optimisticId,
        tenant_id: input.tenantId,
        conversation_id: input.conversationId,
        sender_user_id: undefined,
        sender_role: input.senderRole,
        body: input.body.trim(),
        channel: input.channel ?? 'portal',
        visible_to_client: input.visibleToClient ?? true,
        delivery_status: 'sent',
      })
      .select('*')
      .single();

    if (error) throw error;
    return data as CrmMessage;
  }

  async markRead(params: { conversationId: string; messageId: string; tenantId: string; participantId?: string | null; userId?: string | null }) {
    const { error } = await this.supabase.from('crm_message_reads').upsert({
      tenant_id: params.tenantId,
      conversation_id: params.conversationId,
      message_id: params.messageId,
      participant_id: params.participantId ?? null,
      user_id: params.userId ?? null,
      read_at: new Date().toISOString(),
    }, { onConflict: 'message_id,participant_id' });
    if (error) throw error;
  }

  subscribeInbox(tenantId: string, onChange: RealtimeHandler<unknown>) {
    return this.supabase
      .channel(`crm:inbox:${tenantId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'crm_conversations', filter: `tenant_id=eq.${tenantId}` }, onChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'crm_tickets', filter: `tenant_id=eq.${tenantId}` }, onChange)
      .subscribe();
  }

  subscribeConversation(conversationId: string, onChange: RealtimeHandler<unknown>) {
    return this.supabase
      .channel(`crm:conversation:${conversationId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'crm_messages', filter: `conversation_id=eq.${conversationId}` }, onChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'crm_message_reads', filter: `conversation_id=eq.${conversationId}` }, onChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'crm_conversation_typing', filter: `conversation_id=eq.${conversationId}` }, onChange)
      .subscribe();
  }
}
