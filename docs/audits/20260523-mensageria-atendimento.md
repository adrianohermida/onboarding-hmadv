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

Os componentes legados `MensagensClient.tsx` e `AtendimentoHub.tsx` deixaram de usar `refetchInterval` e passaram a invalidar via `supabase.channel(...).on('postgres_changes')` enquanto a migracao visual completa para `crm_*` nao substitui a tela.

## Proximo recorte

1. Trocar `MensagensClient.tsx` para consumir `vw_crm_inbox` + `crm_messages`.
2. Transformar `AtendimentoHub.tsx` em Central do Cliente usando a mesma conversa do admin.
3. Criar composer unico com anexos, templates e IA assistiva.
4. Migrar `re_messages` e `re_mensagens` para `crm_conversations`/`crm_messages`.
5. Ligar Freshdesk proxy para criar/atualizar `crm_tickets` e anexar eventos em `crm_activity_logs`.
6. Substituir FAQ hardcoded por base de conhecimento.
7. Adicionar virtualizacao da thread com historico incremental.
