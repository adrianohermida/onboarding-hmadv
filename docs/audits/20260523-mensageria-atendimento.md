# Auditoria estrutural: mensageria e atendimento

## Diagnostico

O problema central nao era visual. A mensageria estava dividida entre tres superficies sem dominio comum:

- `apps/web/src/components/mensagens/MensagensClient.tsx`: usa `re_messages`, agrupa conversas no frontend e dependia de polling.
- `apps/web/src/components/atendimento/AtendimentoHub.tsx`: usa `re_mensagens`, mistura ajuda, agenda e mensagens, com FAQ hardcoded e polling.
- `modules/mensagens/CommunicationCenter.js`: cria snapshot/timeline em memoria a partir de registros operacionais.

Isso criava uma experiencia parecida com CRUD/feed, nao uma inbox juridica operacional.

## Debitos confirmados

- Conversas nao existiam como entidade persistida.
- Mensagens eram inferidas por `user_id`, sem participantes, status, ticket ou jornada.
- `refetchInterval` aparecia nos componentes principais de mensagens/atendimento.
- Freshdesk, notificacoes, documentos e timeline estavam conectados por eventos soltos, nao por conversa.
- Busca era local e sem fulltext.
- Nao havia read receipts, typing state, attachments estruturados ou lifecycle de websocket.
- O isolamento multi-tenant dependia de tabelas legadas e nao de um dominio CRM proprio.

## Recorte executado

Foi criada a fundacao relacional em `supabase/migrations-safe/20260523_safe_023_crm_conversational_messaging.sql`:

- `crm_conversations`
- `crm_messages`
- `crm_participants`
- `crm_tickets`
- `crm_journeys`
- `crm_message_attachments`
- `crm_message_reads`
- `crm_message_events`
- `crm_journey_steps`
- `crm_journey_progress`
- `crm_conversation_typing`
- `crm_activity_logs`
- `vw_crm_inbox`

Tambem foram adicionados:

- RLS por `tenant_id`;
- helpers `can_access_crm_conversation` e `can_write_crm_conversation`;
- fulltext em `crm_messages.search_vector`;
- indices por tenant, status, responsavel, ticket, tags e timeline;
- triggers para atualizar `last_message_at`, previews e contadores;
- publicacao realtime das tabelas `crm_*`;
- vinculo com `portal_casos`, `freshdesk_tickets`, SLA e jornada.

## Frontend

Foi adicionada a feature:

- `apps/web/src/features/conversational/types.ts`
- `apps/web/src/features/conversational/ConversationalService.ts`
- `apps/web/src/features/conversational/useRealtimeInbox.ts`

Ela concentra:

- listagem de inbox;
- carregamento incremental de mensagens;
- envio com optimistic update;
- lifecycle de Supabase Realtime;
- subscriptions de inbox, mensagens, leitura e typing.

Os componentes legados deixaram de usar `refetchInterval`. Em seguida, `MensagensClient.tsx` passou a consumir `vw_crm_inbox` e `crm_messages` via `useRealtimeInbox`/`useRealtimeConversation`, deixando de inferir conversas por `user_id`.

O `AtendimentoHub.tsx` passou a preparar a conversa do cliente no dominio CRM: quando ainda nao existe conversa `portal`, o envio inicial cria uma `crm_conversation` e registra a mensagem em `crm_messages`. A leitura legada de `re_mensagens` permanece apenas como compatibilidade visual ate a migracao historica.

A view `vw_crm_inbox` foi ajustada com `security_invoker = true` para respeitar RLS das tabelas base no Data API do Supabase.

## Proximo recorte

1. Concluir a migracao historica de `re_messages` e `re_mensagens` para `crm_conversations`/`crm_messages`.
2. Criar composer unico com anexos, templates e IA assistiva.
3. Ligar Freshdesk proxy para criar/atualizar `crm_tickets` e anexar eventos em `crm_activity_logs`.
4. Substituir FAQ hardcoded por base de conhecimento.
5. Adicionar virtualizacao da thread com historico incremental.
6. Adicionar read receipts e typing state visiveis na UI.
