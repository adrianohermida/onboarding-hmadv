export type ConversationChannel =
  | 'portal'
  | 'whatsapp'
  | 'email'
  | 'freshdesk'
  | 'instagram'
  | 'facebook'
  | 'telegram'
  | 'webchat'
  | 'interno';

export type ConversationStatus =
  | 'open'
  | 'pending'
  | 'waiting_client'
  | 'waiting_staff'
  | 'resolved'
  | 'archived';

export type ConversationPriority = 'low' | 'normal' | 'high' | 'urgent';

export type ConversationPipelineStage =
  | 'novo_lead'
  | 'triagem'
  | 'documentacao'
  | 'diagnostico'
  | 'plano_juridico'
  | 'acao_judicial'
  | 'pos_atendimento'
  | 'encerrado';

export type ParticipantRole =
  | 'client'
  | 'advogado'
  | 'operador'
  | 'admin'
  | 'superadmin'
  | 'bot'
  | 'observer';

export interface CrmConversation {
  id: string;
  tenant_id: string;
  case_id: string | null;
  contact_user_id: string | null;
  contact_email: string | null;
  contact_name: string | null;
  title: string;
  channel: ConversationChannel;
  status: ConversationStatus;
  priority: ConversationPriority;
  pipeline_stage: ConversationPipelineStage;
  assigned_user_id: string | null;
  fd_ticket_id: number | null;
  tags: string[];
  last_message_at: string | null;
  last_message_preview: string | null;
  unread_client_count: number;
  unread_staff_count: number;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  case_client_name?: string | null;
  case_client_cpf?: string | null;
  numero_processo?: string | null;
  ticket_status?: string | null;
  sla_due_at?: string | null;
  active_journey_id?: string | null;
  current_step_key?: string | null;
}

export interface CrmMessage {
  id: string;
  tenant_id: string;
  conversation_id: string;
  sender_participant_id: string | null;
  sender_user_id: string | null;
  sender_role: ParticipantRole | 'integration';
  body: string;
  body_format: 'plain' | 'markdown' | 'html';
  message_type: 'message' | 'internal_note' | 'system_event' | 'ticket_event' | 'journey_event' | 'document_event' | 'ai_suggestion';
  channel: ConversationChannel;
  external_id: string | null;
  reply_to_message_id: string | null;
  visible_to_client: boolean;
  delivery_status: 'draft' | 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  ai_summary: string | null;
  ai_classification: string | null;
  sentiment: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface SendCrmMessageInput {
  conversationId: string;
  tenantId: string;
  body: string;
  senderRole: CrmMessage['sender_role'];
  visibleToClient?: boolean;
  channel?: ConversationChannel;
  optimisticId?: string;
}
