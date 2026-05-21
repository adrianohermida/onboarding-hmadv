# Arquitetura Enterprise — Portal HMADV
## Superendividamento CNJ · Lei 14.181/2021 · Recomendação CNJ 125/2021

> **Princípio fundamental:** Este sistema é uma **evolução organizada do ecossistema existente** —
> não um sistema novo desconectado. Toda expansão é **aditiva**: `ADD COLUMN IF NOT EXISTS`,
> `CREATE OR REPLACE`, `CREATE TABLE IF NOT EXISTS`.
>
> **Versão:** Sprint 8.5 — Enterprise Architecture Completo  
> **Última atualização:** 2026-05-20

---

## Regras Absolutas (imutáveis)

```
✗  PROIBIDO: DROP TABLE · RENAME TABLE · remover colunas · alterar FKs incompatíveis
✗  PROIBIDO: recriar engines existentes (forms, journeys, documents, workflows)
✓  OBRIGATÓRIO: reutilizar tabelas existentes · expandir com ADD COLUMN IF NOT EXISTS
✓  OBRIGATÓRIO: respeitar auth.users · RLS · Storage · Realtime
✓  OBRIGATÓRIO: migrations em /supabase/migrations-safe · verificar existência · reversíveis
```

---

## 1. Mapa do Ecossistema (246+ tabelas auditadas)

### Prefixos de domínio

| Prefixo | Responsabilidade | Tabelas principais |
|---------|-----------------|---------------------|
| `portal_*` | Core CNJ superendividamento | `portal_casos`, `portal_dividas`, `portal_documentos`, `portal_workspaces`, `portal_workspace_members`, `portal_cnj_timeline`, `portal_cnj_notifications` |
| `re_*` | Plataforma RE (engines reutilizáveis) | `re_users`, `re_forms`, `re_form_responses`, `re_form_answers`, `re_journeys`, `re_journey_steps`, `re_documents`, `re_tasks`, `re_notifications`, `re_invoices` |
| `freshdesk_*` | Mirror CRM Freshdesk (SSOT Supabase) | `freshdesk_tickets` (154), `freshdesk_contacts` (5999), `freshdesk_agents`, `freshdesk_groups`, `freshdesk_articles` (249) |
| `freshsales_*` | Mirror CRM Freshsales | `freshsales_contacts` (109), `freshsales_deals_registry` (217), `freshsales_products` (8) |
| `billing_*` | Faturamento / Contratos | `billing_contracts` (250), `billing_receivables` (750), `billing_import_rows` (5954) |
| `agentlab_*` | IA / Automação / RAG | `agentlab_knowledge_chunks` (10225), `agentlab_intents` (31), `agentlab_workflow_library` (20), `agentlab_conversation_threads` (23) |
| `hmadv_*` | Módulos HMADV-específicos | `hmadv_finance_admin_settings`, `hmadv_market_ads_*` |

---

## 2. Diagrama Multi-tenant

```
auth.users (Supabase Auth — SSOT de identidade)
    │
    ├─── portal_workspace_members ─── portal_workspaces (1 escritório = 1 workspace)
    │         role: owner/admin/member     slug, name, plan, settings
    │
    ├─── portal_casos ─────────────── workspace_id → portal_workspaces
    │         user_id (1:1 com auth.users)
    │         re_user_id → re_users         ← bridge para plataforma RE
    │         cnj_form_id → re_forms        ← form template CNJ
    │         cnj_response_id → re_form_responses
    │         fd_contact_id → freshdesk_contacts
    │         fd_ticket_id → freshdesk_tickets
    │         fs_contact_id → freshsales_contacts
    │
    ├─── portal_dividas ────────────── user_id + workspace_id (propagado via trigger)
    ├─── portal_documentos ─────────── user_id + workspace_id + re_document_id → re_documents
    ├─── portal_cnj_timeline ──────── caso_id + workspace_id (append-only, 16 tipos)
    └─── portal_cnj_notifications ─── caso_id + workspace_id (fila multi-canal)
```

---

## 3. Plano de Reutilização (engines existentes)

### ✅ NÃO recriar — reutilizar diretamente

| Engine existente | Tabelas | Como reutilizar no portal CNJ |
|-----------------|---------|-------------------------------|
| **Form Builder** | `re_forms`, `re_form_pages`, `re_form_questions`, `re_form_answers`, `re_form_responses` | Formulário CNJ 7 passos pode ser migrado como `re_forms` com `system_key='cnj_superendividamento'`. `portal_casos.cnj_form_id` e `cnj_response_id` fazem o link. |
| **Journey Engine** | `re_journeys`, `re_journey_steps`, `re_journey_assignments`, `re_journey_step_completions` | Jornada do cliente (cadastro → análise → conciliação) mapeada em `re_journeys`. `re_journey_steps` pode ter `form_id` para cada passo CNJ. |
| **Document Engine** | `re_documents`, `re_form_answers.file_path` | `portal_documentos.re_document_id` já faz o link. Trigger `_sync_portal_doc_to_re_doc` propaga status. |
| **Task Engine** | `re_tasks` | `re_tasks.portal_caso_id` (migration 006) vincula tarefas do escritório a casos específicos. |
| **Notification Engine** | `re_notifications` | Complementar a `portal_cnj_notifications`. Para notificações da plataforma RE (invoices, lembretes). |
| **Billing Engine** | `billing_contracts`, `billing_receivables` | Honorários do escritório associados ao caso. |
| **AgentLab RAG** | `agentlab_knowledge_chunks`, `agentlab_knowledge_sources` | Base de conhecimento jurídico CNJ para suporte IA. |

---

## 4. Formulário CNJ 7 Passos (Lei 14.181/2021)

| Passo | Seção CNJ | Campos chave em `portal_casos` |
|-------|-----------|-------------------------------|
| 1 | Identificação pessoal | `full_name`, `cpf`, `data_nascimento`, `rg`, `estado_civil`, `profissao`, `telefones`, `enderecos` |
| 2 | Situação socioeconômica | `situacao_profissional`, `renda`, `renda_familiar`, `n_dependentes`, `conjugue`, `dependentes` |
| 3 | Despesas e patrimônio | `despesas` (jsonb), `patrimonio` (jsonb) |
| 4 | Análise do endividamento | `causas_endividamento`, `negativacoes`, `conhecimento_credito` |
| 5 | Mapa de credores | `credores_cnj` (jsonb array) |
| 6 | Plano de pagamento | `plano_pagamento` (jsonb), `comprometimento_mensal` |
| 7 | Documentação | `portal_documentos` (7 tipos obrigatórios + 2 opcionais) |

**Cálculos automáticos** (via `cnj-engine.js`):
- `calcAnaliseGlobal()` → comprometimento, índice de endividamento
- `calcPlanoPagamento()` → parcela máxima (renda disponível / 60 meses)
- `buildCNJJson()` → estrutura oficial Lei 14.181/2021

---

## 5. Fases do Caso

```
cadastro → analise → conciliacao → judicial → encerrado
```

| Fase | Trigger automático | Notificação | Timeline |
|------|-------------------|-------------|----------|
| `cadastro` | `handle_new_portal_user()` | magic link Resend | `formulario_enviado` |
| `analise` | Mudança manual admin | email `fase_alterada` | `fase_alterada` |
| `conciliacao` | Agendamento audiência | email + WhatsApp | `conciliacao_agendada` |
| `judicial` | Protocolo CNJ | email | `fase_alterada` |
| `encerrado` | Admin | email | `encerrado` |

**Trigger automático de timeline:** `_auto_timeline_fase_alterada()` insere evento em `portal_cnj_timeline` a cada mudança de `portal_casos.fase`.

---

## 6. Schemas: Tabelas-chave com colunas críticas

### `portal_casos` (núcleo do sistema)
```
id uuid PK | user_id uuid FK auth.users | workspace_id uuid FK portal_workspaces
re_user_id uuid FK re_users | cnj_form_id uuid | cnj_response_id uuid
fd_contact_id bigint | fd_ticket_id bigint | fs_contact_id text
fase text DEFAULT 'cadastro' | cnj_step_atual smallint DEFAULT 1
onboarding_done boolean DEFAULT false | proxima_acao text
credores_cnj jsonb | plano_pagamento jsonb | cnj_json jsonb
metadata jsonb | extra_data jsonb | settings jsonb
```

### `portal_cnj_timeline` (append-only, 16 tipos de evento)
```
id uuid PK | caso_id uuid FK portal_casos | workspace_id uuid
evento_tipo text | evento_subtipo text | descricao text
payload jsonb | author_uid uuid | author_role text
fd_ticket_id bigint | re_task_id uuid | documento_id uuid
is_visible_client boolean DEFAULT true | created_at timestamptz
```

**Tipos de evento:** `formulario_enviado`, `ticket_criado`, `ticket_atualizado`, `documento_aprovado`, `documento_rejeitado`, `documento_enviado`, `fase_alterada`, `step_concluido`, `notificacao_enviada`, `comentario_admin`, `conciliacao_agendada`, `acordo_formalizado`, `encerrado`

### `freshdesk_tickets` (mirror completo)
```
fd_ticket_id bigint | portal_caso_id uuid | fd_contact_id bigint
subject text | status int | cnj_fase text | cnj_form_json jsonb
metadata jsonb | created_at timestamptz
```

---

## 7. Funções SECURITY DEFINER (RLS helpers)

| Função | Retorno | Descrição |
|--------|---------|-----------|
| `is_platform_admin()` | `boolean` | Lê `admin_profiles.is_platform_admin` |
| `is_any_admin()` | `boolean` | `admin_users` OR `is_platform_admin()` OR workspace owner/admin |
| `my_workspace_ids()` | `uuid[]` | Todos os `workspace_id` do usuário logado |
| `rpc_get_meu_caso()` | `TABLE` | Caso + timeline + docs para usuário atual |
| `rpc_admin_busca_cpf(cpf)` | `jsonb` | Busca caso por CPF (admin only) |
| `admin_get_stats()` | `json` | Métricas agregadas do escritório |
| `admin_get_clients()` | `TABLE` | Lista de clientes com KPIs |
| `rpc_admin_workspace_stats(uuid)` | `json` | Métricas drill-down por workspace |

---

## 8. Views unificadas

| View | Propósito | Fonte de dados |
|------|-----------|----------------|
| `vw_superendividamento_cliente` | Dashboard cliente: caso completo | `portal_casos` + `auth.users` + FD + docs |
| `vw_cnj_dashboard_admin` | Admin: KPIs por workspace/fase | `portal_casos` + `portal_workspaces` |
| `vw_cnj_mapa_credores_analise` | Mapa de credores expandido | `portal_casos.credores_cnj` (jsonb unnest) |
| `vw_freshdesk_portal_sync` | Status de sincronização FD | `portal_casos` + `freshdesk_contacts` + `freshdesk_tickets` |
| `vw_admin_global` | Dashboard platform-level por workspace | Todas as tabelas portal_* + FD |
| `vw_admin_casos_detalhado` | Lista de casos enriquecida para admin | `portal_casos` + JOINs calculados |
| `vw_portal_cnj_form_status` | Bridge portal_casos ↔ re_forms | `portal_casos` + `re_forms` + `re_form_responses` |

---

## 9. Matriz RLS

| Tabela | Política cliente | Política admin |
|--------|-----------------|----------------|
| `portal_casos` | `user_id = auth.uid()` | `is_any_admin()` |
| `portal_dividas` | `user_id = auth.uid()` | `is_any_admin()` + workspace |
| `portal_documentos` | `user_id = auth.uid()` | `is_any_admin()` + workspace |
| `portal_cnj_timeline` | `caso_id IN (SELECT id FROM portal_casos WHERE user_id = auth.uid())` AND `is_visible_client` | `is_any_admin()` |
| `portal_cnj_notifications` | N/A (somente sistema) | `is_any_admin()` |
| `portal_workspaces` | `id = ANY(my_workspace_ids())` | `is_platform_admin()` |
| `re_documents` | `user_id = auth.uid()` | `is_any_admin()` |
| `re_form_responses` | `user_id = auth.uid()` | `is_any_admin()` |
| `freshdesk_tickets` | N/A (somente via RPC) | `is_any_admin()` |
| `admin_profiles` | N/A | `is_platform_admin()` |

---

## 10. Plano de Migrations Seguras

### `/supabase/migrations-safe/` — ordem de aplicação

```
001_bridges.sql              ← re_users.portal_caso_id + portal_documentos.re_document_id
002_workspace_admin.sql      ← portal_workspaces + portal_workspace_members + admin_profiles
003_cnj_timeline.sql         ← portal_cnj_timeline + portal_cnj_notifications
004_views_rls.sql            ← 4 views unificadas + rpc_get_meu_caso + rpc_admin_busca_cpf
005_multitenant_propagation  ← workspace_id em portal_dividas + portal_documentos + trigger
006_re_bridges.sql           ← cnj_form_id, cnj_response_id + workspace_id em re_forms/re_journeys
007_admin_global.sql         ← vw_admin_global + vw_admin_casos_detalhado + RPCs aprimorados
008_rls_secure.sql           ← RLS nas 11 tabelas sem proteção (auditadas)
009_sync_triggers.sql        ← 5 triggers: sync re_users, sync re_documents, auto-timeline, auto-notificação
```

### Estratégia de aplicação
1. **Jamais usar `apply_migration` em produção** sem revisar o SQL completo
2. Testar em branch Supabase antes de aplicar em prod
3. Cada migration tem seção de REVERSÃO documentada
4. Usar `DO $$ BEGIN ... END $$` com `IF NOT EXISTS` para idempotência
5. Backfills com `UPDATE ... WHERE campo IS NULL` (não toca dados existentes)

---

## 11. Integração Freshdesk — Fluxo completo

```
Cliente preenche formulário CNJ (onboarding.html)
  └── finalizarCadastro() → CaseService.save(payload) → portal_casos (upsert)
        └── Edge Function portal-cnj-complete (Deno/TS):
              1. Carrega portal_casos via service_role
              2. POST /api/v2/tickets → Freshdesk ticket criado
              3. UPDATE portal_casos SET fd_ticket_id = X
              4. INSERT freshdesk_tickets (mirror)
              5. INSERT portal_cnj_timeline (ticket_criado)
              6. POST Resend API → email cliente + escritório
              7. INSERT portal_cnj_notifications (registro)
        └── Trigger _auto_timeline_onboarding_done → formulario_enviado na timeline

Admin acessa dashboard.html
  └── rpc_get_meu_caso() / AdminService.getClients()
  └── vw_cnj_dashboard_admin → KPIs por workspace/fase
  └── vw_admin_global → métricas plataforma

Admin muda fase do caso:
  └── UPDATE portal_casos SET fase = 'analise'
        └── Trigger _auto_timeline_fase_alterada → evento na timeline
        └── Edge Function portal-notify → email tipo 'fase_alterada'
```

---

## 12. Segredos e Configurações (nunca no frontend)

| Segredo | Onde armazenar | Uso |
|---------|---------------|-----|
| `DIRECTDATA_TOKEN` | Supabase Vault + GitHub Secrets | Lookup CPF (directdata-proxy) |
| `RESEND_API_KEY` | Supabase Edge Function secrets | Envio de emails |
| `FRESHDESK_API_KEY` | Supabase Edge Function secrets | API Freshdesk v2 |
| `FRESHSALES_TOKEN` | Supabase Vault | OAuth Freshsales |
| `FROM_EMAIL` | Edge Function env | Sempre `contato@hermidamaia.adv.br` |
| `OFFICE_EMAIL` | Edge Function env | `contato@hermidamaia.adv.br` |
| Dev bypass `172145` | NUNCA no frontend | Apenas server-side |

---

## 13. Design System Hermida Maia

| Token CSS | Valor | Uso |
|-----------|-------|-----|
| `--navy` | `#1A3A5C` | Sidebar, headers, fundo login |
| `--blue` | `#2E6DA4` | Ações primárias, links |
| `--brand-gold` | `#F5A623` | Marca, destaques |
| `--ok` | `#1a7a4a` | Sucesso, aprovado |
| `--warn` | `#b45309` | Atenção, pendente |
| `--red` | `#C0392B` | Erro, dívida abusiva |
| `--serif` | Libre Baskerville | Headings, valores financeiros |
| `--sans` | DM Sans | Corpo, labels, botões |

---

## 14. Roadmap de Sprints

| Sprint | Escopo | Status |
|--------|--------|--------|
| 0 | Refatoração estrutural base | ✅ |
| 1 | Branding + Autenticação Supabase | ✅ |
| 2 | Integração Freshdesk | ✅ |
| 3 | Upload de documentos + pipeline de aprovação | ✅ |
| 4 | Análise de dívidas (portal_dividas) | ✅ |
| 5 | Admin dashboard + DirectData CPF lookup | ✅ |
| 6 | Shell persistente + pipeline avançado | ✅ |
| 7 | Formulário CNJ 7 passos + cnj-engine.js | ✅ |
| 7.5 | Enterprise Architecture — multi-tenant, timeline, views | ✅ |
| 8 | Portal Pós-Onboarding — ticket, timeline, step bar | ✅ |
| 8.5 | QA Sprint 0–8 — bugs mobile, mode selector, demo user | ✅ |
| **9** | **Admin CNJ — vw_cnj_dashboard_admin, busca CPF UI** | 🔜 |
| **10** | **Notificações push + WhatsApp + fila portal_cnj_notifications** | 🔜 |
| **11** | **Relatórios PDF — petição CNJ, plano 104-A, mapa credores** | 🔜 |
| **12** | **re_forms bridge — formulário CNJ via engine re_forms** | 🔜 |
| **13** | **Billing — honorários por caso + re_invoices** | 🔜 |
