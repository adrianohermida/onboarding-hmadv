'use client';

import { useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { ConversationalService } from './ConversationalService';
import type { CrmMessage, SendCrmMessageInput } from './types';

export function useRealtimeInbox(params: {
  tenantId: string | null;
  search?: string;
  status?: string;
  assignedUserId?: string;
}) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const service = useMemo(() => new ConversationalService(supabase), [supabase]);
  const queryKey = ['crm-inbox', params.tenantId, params.search ?? '', params.status ?? 'all', params.assignedUserId ?? ''];

  const inbox = useQuery({
    queryKey,
    enabled: Boolean(params.tenantId),
    queryFn: () => service.listInbox({
      search: params.search,
      status: params.status,
      assignedUserId: params.assignedUserId,
    }),
    staleTime: 20_000,
  });

  useEffect(() => {
    if (!params.tenantId) return undefined;
    const channel = service.subscribeInbox(params.tenantId, () => {
      queryClient.invalidateQueries({ queryKey: ['crm-inbox', params.tenantId] });
    });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [params.tenantId, queryClient, service, supabase]);

  return inbox;
}

export function useRealtimeConversation(conversationId: string | null) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const service = useMemo(() => new ConversationalService(supabase), [supabase]);
  const queryKey = ['crm-messages', conversationId];

  const messages = useQuery({
    queryKey,
    enabled: Boolean(conversationId),
    queryFn: () => service.listMessages(conversationId as string),
    staleTime: 20_000,
  });

  useEffect(() => {
    if (!conversationId) return undefined;
    const channel = service.subscribeConversation(conversationId, () => {
      queryClient.invalidateQueries({ queryKey });
    });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient, service, supabase]);

  const sendMessage = useMutation({
    mutationFn: (input: SendCrmMessageInput) => service.sendMessage(input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<CrmMessage[]>(queryKey) ?? [];
      const optimisticId = input.optimisticId ?? crypto.randomUUID();
      queryClient.setQueryData<CrmMessage[]>(queryKey, [
        ...previous,
        {
          id: optimisticId,
          tenant_id: input.tenantId,
          conversation_id: input.conversationId,
          sender_participant_id: null,
          sender_user_id: null,
          sender_role: input.senderRole,
          body: input.body,
          body_format: 'plain',
          message_type: 'message',
          channel: input.channel ?? 'portal',
          external_id: null,
          reply_to_message_id: null,
          visible_to_client: input.visibleToClient ?? true,
          delivery_status: 'sending',
          ai_summary: null,
          ai_classification: null,
          sentiment: null,
          metadata: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          deleted_at: null,
        },
      ]);
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return { ...messages, sendMessage };
}
