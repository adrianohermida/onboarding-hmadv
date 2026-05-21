# Arquitetura do Portal HMADV — Superendividamento CNJ

> **Lei 14.181/2021 + Recomendação CNJ 125/2021 (Anexo II)**
> Versão: Sprint 7 — Enterprise Architecture
> Última atualização: 2026-05-20

---

## Princípios Fundamentais

```
NÃO recrie o banco.      NÃO reinvente funcionalidades.      NÃO quebre compatibilidade.
```

O sistema é uma **evolução organizada do ecossistema existente** — não um sistema novo desconectado. Toda expansão é aditiva: `ADD COLUMN IF NOT EXISTS`, `CREATE TABLE IF NOT EXISTS`, `CREATE OR REPLACE`.

---

## Mapa de Ecossistema

### Schemas ativos (246+ tabelas)

| Schema | Responsabilidade | Tabelas-chave |
|--------|-----------------|---------------|
| `public` | Core do portal CNJ | `portal_casos`, `portal_dividas`, `portal_documentos`, `portal_workspaces`, `portal_workspace_members`, `portal_cnj_timeline`, `portal_cnj_notifications` |
| `re_*` | Plataforma RE (forms, journeys, documents, tasks) | `re_users`, `re_forms`, `re_journeys`, `re_documents`, `re_tasks`, `re_form_responses` |
| `freshdesk_*` | CRM / Suporte | `freshdesk_contacts`, `freshdesk_tickets`, `freshdesk_agents` |
| `freshsales_*` | CRM / Vendas | `freshsales_contacts`, `freshsales_deals` |
| `billing_*` | Faturamento / Contratos | `billing_contracts`, `billing_invoices` |
| `agentlab_*` | IA / Automação | `agentlab_agents`, `agentlab_runs` |
| `auth` | Supabase Auth (não modificar) | `auth.users` |
| `storage` | Supabase Storage (não modificar) | `storage.objects`, `storage.buckets` |

### Engines existentes — NÃO recriar

| Engine | Localização | Uso |
|--------|-------------|-----|
| Form Builder | `re_forms` + `re_form_responses` | Formulários dinâmicos |
| Onboarding Journey | `re_journeys` | Fluxo de onboarding genérico |
| Document Engine | `re_documents` | GED / gestão de documentos |
| Task/Workflow | `re_tasks` | Automação e orquestração |
| **CNJ Engine** | `js/cnj-engine.js` | Cálculos Lei 14.181 (SELIC, cap cartão, Price, mínimo existencial) |

---

## Arquitetura Multi-tenant

```
platform_admin (is_platform_admin = true)
    └── portal_workspaces  (slug: hmadv-principal, hmadv-sp, ...)
            └── portal_workspace_members  (role: owner | admin | advogado | estagiario | member)
                    └── portal_casos  (workspace_id FK)
                            └── portal_cnj_timeline (append-only)
                            └── portal_documentos
                            └── portal_dividas
```

### Funções de autorização (SECURITY DEFINER)

```sql
is_platform_admin()   -- super-admin com acesso irrestrito
is_any_admin()        -- admin_users + platform_admin + workspace owner/admin
my_workspace_ids()    -- array de workspace_ids do usuário atual
get_re_user_id()      -- auth.uid() → re_users.id
```

---

## Fluxo CNJ — Lei do Superendividamento

```
Cliente                    Portal                      Backend / Integrações
  │                          │                                │
  ├─ Acessa /onboarding ────►│                                │
  │                          ├─ Step 1: CPF → DirectData ────►│ (API DirectData)
  │                          ├─ Step 2-4: Formulário CNJ      │
  │                          ├─ Step 5: Mapa de Credores      │
  │                          │   ├─ SELIC correction          │
  │                          │   ├─ Cap cartão 200%           │
  │                          │   └─ Price amortization        │
  │                          ├─ Step 6: Análise (cnj-engine)  │
  │                          └─ Step 7: Documentação          │
  │                                 │                         │
  │                          finalizarCadastro()              │
  │                                 ├──────────────────────► portal_casos (upsert)
  │                                 │                        portal_cnj_timeline (trigger)
  │                                 └──────────────────────► Freshdesk ticket (webhook)
  │                                                          portal_cnj_notifications (queue)
```

### Steps do Formulário CNJ (7 etapas)

| Step | Conteúdo | Campos-chave | CNJ Ref |
|------|----------|--------------|---------|
| 1 | Identificação | CPF, nome, RG, endereços, telefones | Anexo II §1 |
| 2 | Socioeconômico | situacao_profissional, renda, dependentes | §2a-c |
| 3 | Despesas e Patrimônio | 12 categorias, imóvel, veículo | §2d-i |
| 4 | Endividamento | causas, negativações, como soube | §2j-o |
| 5 | Mapa de Credores | credores_cnj[], SELIC, cap cartão | §3 |
| 6 | Análise | calcAnaliseGlobal(), plano art. 104-A | art. 104-A CDC |
| 7 | Documentação | checklist, JSON preview, observações | — |

---

## Cálculos Legais — `js/cnj-engine.js`

### Constantes

```javascript
SALARIO_MINIMO       = 1622.00   // vigente 2024
SELIC_ANUAL          = 0.1375    // Lei 14.905/2024
SELIC_MENSAL         = (1 + SELIC_ANUAL)^(1/12) - 1
CAP_CARTAO_FATOR     = 2.0       // 200% do valor original
PRAZO_MAX_MESES      = 60        // art. 104-A CDC
MINIMO_EXISTENCIAL   = 405.50    // 25% SM × Decreto 11.150/2022
```

### Funções principais

| Função | Finalidade |
|--------|-----------|
| `calcMinimoExistencial()` | Retorna R$ 405,50 (25% SM) |
| `corrigirPorSelic(valor, dataVenc, dataBase?)` | Correção SELIC com contagem de meses |
| `aplicarCapCartao(original, pago, saldo)` | Cap 200% — Lei 14.181 art. 54-B |
| `calcSaldoSemJurosFuturos(pmt, taxa, n)` | PV pela tabela Price |
| `calcCredor(credor)` | Aplica Price + SELIC + cap automaticamente |
| `calcPlanoPagamento({...})` | Plano art. 104-A, viabilidade, prazo necessário |
| `calcAnaliseGlobal({...})` | Análise completa: comprometimento, mínimo existencial, alertas |
| `buildCNJJson(caso)` | Gera JSON estruturado CNJ (§1, §2a-o, §3) para petições |
| `saveDraft / loadDraft / clearDraft` | Autosave localStorage (`cnj_draft`) |

---

## Schema de Banco — Tabelas Principais

### `portal_casos` — case central

Colunas nativas + expansões Sprint 7 + bridges Safe 001:

```
id, user_id, workspace_id, full_name, cpf, data_nascimento, ...
-- Sprint 7 (CNJ):
situacao_profissional, renda_familiar, despesas, patrimonio,
causas_endividamento, negativacoes, conhecimento_credito,
credores_cnj, comprometimento_mensal, plano_pagamento,
cnj_json, cnj_step_atual
-- Safe 001 (bridges):
rg_emissor, re_user_id, fd_contact_id, fd_ticket_id,
workspace_id, metadata, extra_data, settings
```

### `portal_cnj_timeline` — log imutável

```
id, caso_id, workspace_id, evento_tipo (CHECK 16 tipos),
evento_subtipo, descricao, payload, author_uid, author_role,
fd_ticket_id, re_task_id, documento_id, step_cnj,
is_visible_client, created_at   -- sem updated_at (append-only)
```

**Triggers automáticos:**
- `trg_auto_timeline_portal_casos` → grava ao mudar `fase`, `cnj_step_atual`, `onboarding_done`
- `trg_auto_timeline_portal_documentos` → grava ao aprovar/rejeitar documento

### `portal_cnj_notifications` — fila multi-canal

```
id, caso_id, workspace_id, timeline_id,
recipient_uid, recipient_email, canal (email|freshdesk|portal|whatsapp|sms),
assunto, corpo_html, corpo_texto, template_key, template_vars,
status (pendente|enviado|falhou|ignorado|cancelado),
tentativas, max_tentativas, ultimo_erro,
agendado_para, enviado_em, resend_id, fd_note_id
```

---

## Views Unificadas

### `vw_superendividamento_cliente`

```sql
portal_casos
   LEFT JOIN re_users           (ON re_users.auth_id = portal_casos.user_id)
  LEFT JOIN LATERAL freshdesk_contacts  (por email)
  LEFT JOIN LATERAL freshdesk_tickets   (último ticket)
  LEFT JOIN LATERAL portal_documentos   (contadores)
  LEFT JOIN LATERAL portal_cnj_timeline (resumo)
  LEFT JOIN portal_workspaces
```
`WITH (security_barrier = true)` — protege contra query pushdown malicioso.

### `vw_cnj_dashboard_admin`
Painel executivo agrupado por `workspace_id + fase`. KPIs: total casos, formulários completos, total dívidas declaradas, renda média, casos críticos (comprometimento > 30%).

### `vw_cnj_mapa_credores_analise`
Expande `credores_cnj[]` em linhas normalizadas via `jsonb_array_elements WITH ORDINALITY`. Permite queries analíticas sobre credores individuais.

### `vw_freshdesk_portal_sync`
Estado de sincronização portal ↔ Freshdesk. Flags: `tem_fd_contact`, `tem_fd_ticket`, `fd_contact_orphan`.

---

## RPCs (SECURITY DEFINER)

### `rpc_get_meu_caso()` — uso pelo cliente
Retorna dados completos do caso autenticado: fase, step, docs (contadores), últimos 10 eventos da timeline (só `is_visible_client = true`), `fd_ticket_id`, `workspace_slug`.

### `rpc_admin_busca_cpf(_cpf TEXT)` — uso admin
Guard `is_any_admin()`. Busca caso por CPF (sanitizado via `regexp_replace`), retorna JSONB consolidado: caso + auth_email + fd_contact + docs[] + timeline[] + último ticket.

---

## RLS — Matriz de Acesso

| Tabela / View | Cliente (owner) | Workspace Admin | Platform Admin |
|---------------|-----------------|-----------------|----------------|
| `portal_casos` | SELECT (own) | SELECT (workspace) | ALL |
| `portal_documentos` | SELECT/INSERT (own) | SELECT (workspace) | ALL |
| `portal_cnj_timeline` | SELECT (visible_client=true) | SELECT (workspace) | ALL |
| `portal_cnj_notifications` | SELECT (canal=portal) | — | ALL |
| `portal_workspaces` | SELECT (member) | UPDATE (owner) | ALL |
| `portal_workspace_members` | SELECT (member) | — | ALL |
| `vw_superendividamento_cliente` | GRANT SELECT (filtered by RLS) | GRANT SELECT | GRANT SELECT |

---

## Migrations

### Ordem de execução

```
supabase/migrations/
  20260520_sprint7_cnj_campos.sql      ← Sprint 7: +12 colunas CNJ

supabase/migrations-safe/              ← Enterprise Architecture (aditivas/reversíveis)
  20260520_safe_001_bridges.sql        ← Pontes: rg_emissor, re_user_id, fd_*, workspace_id
  20260520_safe_002_workspace_admin.sql← Multi-tenant: workspaces, members, funções admin
  20260520_safe_003_cnj_timeline.sql   ← Timeline + Notificações + Triggers automáticos
  20260520_safe_004_views_rls.sql      ← Views consolidadas + RPCs + Grants
```

### Estratégia de segurança

- `ADD COLUMN IF NOT EXISTS` apenas — nunca `DROP`, `RENAME`, `ALTER TYPE` incompatível
- `CREATE TABLE IF NOT EXISTS` — idempotente
- `CREATE OR REPLACE` para funções e views
- `DROP TRIGGER IF EXISTS` antes de criar (idempotente)
- `INSERT ... ON CONFLICT DO NOTHING` para seeds
- `CREATE INDEX CONCURRENTLY IF NOT EXISTS` — não bloqueia tabela
- Seção `-- DOWN` em cada arquivo para rollback manual documentado

---

## Integrações Externas

| Sistema | Bridge | Secret |
|---------|--------|--------|
| **DirectData** | CPF lookup no Step 1 | `DIRECTDATA_TOKEN` (Supabase/GitHub secret apenas) |
| **Freshdesk** | `freshdesk_contacts`, `freshdesk_tickets`, `fd_contact_id`, `fd_ticket_id` | `FRESHDESK_API_KEY` |
| **Resend** | `portal_cnj_notifications.resend_id` | `RESEND_API_KEY` |
| **Freshsales** | `freshsales_contacts`, `fs_contact_id` | `FRESHSALES_API_KEY` |
| **RE Platform** | `re_users`, `re_user_id`, `re_task_id`, `re_document_id` | interno |

### Regras de segurança (invioláveis)

- `DIRECTDATA_TOKEN` → **NUNCA** no frontend. Apenas `DIRECTDATA_TOKEN` como secret server-side.
- `FROM_EMAIL` → sempre `contato@hermidamaia.adv.br` (não `portal@hermidamaia.adv.br`)
- Bypass dev (`172145`) → **NUNCA** exposto na UI de produção
- Imagens da marca → apenas `logo-hermidamaia.png` e `logo-hermidamaia-sq.png` (sem SVG/IA)

---

## Estrutura de Arquivos

```
onboarding-hmadv/
├── pages/
│   └── onboarding.html          ← Formulário CNJ 7 steps (Sprint 7)
├── js/
│   └── cnj-engine.js            ← Engine legal (SELIC, cap, Price, buildCNJJson)
├── services/
│   └── database.js              ← CaseService.saveCNJStep() + demais serviços
├── supabase/
│   ├── migrations/
│   │   └── 20260520_sprint7_cnj_campos.sql
│   └── migrations-safe/
│       ├── 20260520_safe_001_bridges.sql
│       ├── 20260520_safe_002_workspace_admin.sql
│       ├── 20260520_safe_003_cnj_timeline.sql
│       └── 20260520_safe_004_views_rls.sql
└── ARCHITECTURE.md              ← este arquivo
```

---

## Status das Migrations (2026-05-20)

| Migration | Status | Observação |
|-----------|--------|------------|
| `sprint7_cnj_campos` | ✅ Aplicada | 12 colunas CNJ em portal_casos |
| `safe_001_bridges` | ✅ Aplicada | Bridges + sync trigger rg_emissor |
| `safe_002_workspace_admin` | ✅ Aplicada | Workspace hmadv-principal criado |
| `safe_003_cnj_timeline` | ✅ Aplicada | Timeline + notif + triggers automáticos |
| `safe_004_views_rls` | ✅ Aplicada | 4 views + 2 RPCs + grants |
