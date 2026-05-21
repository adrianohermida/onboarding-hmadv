-- ============================================================
-- MIGRATION SAFE 004 — Views Unificadas + RLS Global
-- Cria views de leitura inteligente para admins e relatórios.
-- SECURITY DEFINER para cross-schema sem bypass de dados.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. vw_superendividamento_cliente
--    Visão consolidada do caso CNJ com dados de todos os sistemas
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW vw_superendividamento_cliente
WITH (security_barrier = true)
AS
SELECT
  -- ── Chaves primárias ────────────────────────────────────
  pc.id                           AS caso_id,
  pc.user_id                      AS auth_uid,
  pc.workspace_id,
  pc.re_user_id,

  -- ── Identificação (CNJ §1) ──────────────────────────────
  pc.full_name,
  pc.cpf,
  pc.data_nascimento,
  pc.sexo,
  pc.estado_civil,
  pc.profissao,
  pc.situacao_profissional,
  pc.nome_mae,
  pc.naturalidade,
  pc.nacionalidade,
  pc.rg,
  COALESCE(pc.rg_emissor, pc.rg_orgao_emissor)  AS rg_emissor,
  pc.telefones,
  pc.enderecos,

  -- ── Socioeconômico (CNJ §2a-f) ──────────────────────────
  pc.renda,
  pc.renda_familiar,
  pc.n_dependentes,
  pc.dependentes,
  pc.conjugue,

  -- ── Despesas + Patrimônio (CNJ §2d-i) ───────────────────
  pc.despesas,
  pc.patrimonio,

  -- ── Endividamento (CNJ §2j-o) ───────────────────────────
  pc.causas_endividamento,
  pc.negativacoes,
  pc.conhecimento_credito,
  jsonb_array_length(COALESCE(pc.credores_cnj, '[]')) AS n_credores_cnj,
  pc.credores_cnj,
  pc.comprometimento_mensal,
  pc.plano_pagamento,

  -- ── Status do processo ──────────────────────────────────
  pc.fase,
  pc.onboarding_done,
  pc.cnj_step_atual,
  pc.proxima_acao,
  pc.observacoes,

  -- ── Auth (via subquery para não expor auth.users diretamente) ──
  (SELECT u.email          FROM auth.users u WHERE u.id = pc.user_id) AS email,
  (SELECT u.created_at     FROM auth.users u WHERE u.id = pc.user_id) AS auth_created_at,
  (SELECT u.last_sign_in_at FROM auth.users u WHERE u.id = pc.user_id) AS last_sign_in_at,

  -- ── re_users (perfil no sistema RE) ────────────────────
  ru.name                         AS re_user_name,
  ru.phone                        AS re_user_phone,
  ru.freshdesk_contact_id         AS re_fd_contact_id,
  ru.freshsales_contact_id        AS re_fs_contact_id,
  ru.credits_balance              AS re_credits_balance,

  -- ── Freshdesk contact (match por email) ────────────────
  fdc.fd_contact_id,
  fdc.name                        AS fd_contact_name,
  fdc.lifecycle_stage             AS fd_lifecycle_stage,
  fdc.tickets_count               AS fd_tickets_count,
  fdc.last_interaction_at         AS fd_last_interaction_at,

  -- ── Último ticket Freshdesk ─────────────────────────────
  lft.fd_ticket_id                AS last_ticket_fd_id,
  lft.subject                     AS last_ticket_subject,
  lft.status                      AS last_ticket_status,
  lft.cnj_fase                    AS last_ticket_cnj_fase,
  lft.created_at                  AS last_ticket_created_at,

  -- ── Documentos (contadores) ─────────────────────────────
  COALESCE(docs.total,      0)    AS docs_total,
  COALESCE(docs.aprovados,  0)    AS docs_aprovados,
  COALESCE(docs.pendentes,  0)    AS docs_pendentes,
  COALESCE(docs.rejeitados, 0)    AS docs_rejeitados,
  COALESCE(docs.em_analise, 0)    AS docs_em_analise,

  -- ── Timeline ────────────────────────────────────────────
  COALESCE(tl.total_eventos, 0)   AS timeline_total_eventos,
  tl.ultimo_evento_at,
  tl.ultimo_evento_tipo,

  -- ── Workspace ───────────────────────────────────────────
  pw.slug                         AS workspace_slug,
  pw.name                         AS workspace_name,

  -- ── Timestamps ──────────────────────────────────────────
  pc.created_at,
  pc.updated_at

FROM portal_casos pc

-- re_users por auth_id = user_id
LEFT JOIN re_users ru
  ON ru.auth_id = pc.user_id

-- Freshdesk contact por email
LEFT JOIN LATERAL (
  SELECT fdc2.*
  FROM freshdesk_contacts fdc2
  WHERE fdc2.email = (SELECT u.email FROM auth.users u WHERE u.id = pc.user_id)
  LIMIT 1
) fdc ON true

-- Último ticket Freshdesk
LEFT JOIN LATERAL (
  SELECT ft.fd_ticket_id, ft.subject, ft.status, ft.cnj_fase, ft.created_at
  FROM freshdesk_tickets ft
  WHERE ft.portal_caso_id = pc.id
     OR (fdc.fd_contact_id IS NOT NULL AND ft.fd_contact_id = fdc.fd_contact_id)
  ORDER BY ft.created_at DESC
  LIMIT 1
) lft ON true

-- Contadores de documentos
LEFT JOIN LATERAL (
  SELECT
    COUNT(*)                                          AS total,
    COUNT(*) FILTER (WHERE status = 'aprovado')       AS aprovados,
    COUNT(*) FILTER (WHERE status = 'pendente')       AS pendentes,
    COUNT(*) FILTER (WHERE status = 'rejeitado')      AS rejeitados,
    COUNT(*) FILTER (WHERE status = 'em_analise')     AS em_analise
  FROM portal_documentos
  WHERE user_id = pc.user_id
) docs ON true

-- Resumo timeline
LEFT JOIN LATERAL (
  SELECT
    COUNT(*)                    AS total_eventos,
    MAX(created_at)             AS ultimo_evento_at,
    (SELECT evento_tipo FROM portal_cnj_timeline
     WHERE caso_id = pc.id ORDER BY created_at DESC LIMIT 1) AS ultimo_evento_tipo
  FROM portal_cnj_timeline
  WHERE caso_id = pc.id
) tl ON true

-- Workspace
LEFT JOIN portal_workspaces pw
  ON pw.id = pc.workspace_id;

COMMENT ON VIEW vw_superendividamento_cliente IS
  'Visão consolidada do caso CNJ. Une portal_casos + re_users + freshdesk + documentos + timeline. '
  'Acesso restrito por RLS nas tabelas base — use apenas em contexto autenticado como admin.';

-- ────────────────────────────────────────────────────────────
-- 2. vw_cnj_dashboard_admin
--    Painel administrativo agregado por workspace/fase
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW vw_cnj_dashboard_admin AS
SELECT
  pc.workspace_id,
  pw.name                                                  AS workspace_name,
  pc.fase,
  COUNT(*)                                                 AS total_casos,
  COUNT(*) FILTER (WHERE pc.onboarding_done = true)        AS formularios_completos,
  COUNT(*) FILTER (WHERE pc.onboarding_done = false)       AS formularios_incompletos,
  COUNT(*) FILTER (WHERE pc.cnj_step_atual >= 7)           AS cnj_finalizado,
  AVG(pc.renda)::NUMERIC(12,2)                             AS renda_media,
  AVG(pc.renda_familiar)::NUMERIC(12,2)                   AS renda_familiar_media,
  SUM(
    COALESCE(
      (SELECT SUM((c->>'valorDeclarado')::numeric)
       FROM jsonb_array_elements(pc.credores_cnj) c),
      0
    )
  )::NUMERIC(14,2)                                         AS total_dividas_declaradas,
  AVG(jsonb_array_length(COALESCE(pc.credores_cnj,'[]')))::NUMERIC(5,1) AS media_credores,
  COUNT(*) FILTER (WHERE pc.comprometimento_mensal > pc.renda * 0.30) AS casos_criticos,
  MAX(pc.updated_at)                                       AS ultimo_update
FROM portal_casos pc
LEFT JOIN portal_workspaces pw ON pw.id = pc.workspace_id
GROUP BY pc.workspace_id, pw.name, pc.fase;

COMMENT ON VIEW vw_cnj_dashboard_admin IS
  'Painel executivo CNJ por workspace e fase. Uso exclusivo admin.';

-- ────────────────────────────────────────────────────────────
-- 3. vw_cnj_mapa_credores_analise
--    Expansão do array credores_cnj para linhas analisáveis
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW vw_cnj_mapa_credores_analise AS
SELECT
  pc.id                                              AS caso_id,
  pc.user_id,
  pc.workspace_id,
  pc.full_name                                       AS cliente_nome,
  pc.cpf                                             AS cliente_cpf,
  (credor.value ->> 'nome')                          AS credor_nome,
  (credor.value ->> 'tipo')                          AS credor_tipo,
  (credor.value ->> 'valorDeclarado')::NUMERIC(14,2) AS valor_declarado,
  (credor.value ->> 'parcela')::NUMERIC(12,2)        AS parcela_mensal,
  (credor.value ->> 'garantia')                      AS garantia,
  (credor.value ->> 'dataVencimento')::DATE          AS data_vencimento,
  (credor.value -> 'processo_judicial')::BOOLEAN     AS processo_judicial,
  (credor.value -> 'consignado')::BOOLEAN            AS consignado,
  (credor.value -> 'vencida')::BOOLEAN               AS vencida,
  (credor.value -> 'renegociacao')::BOOLEAN          AS renegociacao,
  (credor.value -> 'recebeu_contrato')::BOOLEAN      AS recebeu_contrato,
  (credor.value -> 'informado_juros')::BOOLEAN       AS informado_juros,
  (credor.value -> 'inadimplente_anterior')::BOOLEAN AS inadimplente_anterior,
  credor.ordinality                                  AS posicao_array
FROM portal_casos pc,
  jsonb_array_elements(COALESCE(pc.credores_cnj, '[]')) WITH ORDINALITY AS credor(value, ordinality)
WHERE jsonb_array_length(COALESCE(pc.credores_cnj, '[]')) > 0;

COMMENT ON VIEW vw_cnj_mapa_credores_analise IS
  'Expande credores_cnj[] em linhas normalizadas para análise e relatórios.';

-- ────────────────────────────────────────────────────────────
-- 4. vw_freshdesk_portal_sync
--    Estado de sincronização portal ↔ Freshdesk por caso
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW vw_freshdesk_portal_sync AS
SELECT
  pc.id                   AS caso_id,
  pc.full_name            AS cliente_nome,
  pc.cpf,
  pc.fase                 AS caso_fase,
  pc.onboarding_done,
  pc.fd_contact_id        AS portal_fd_contact_id,
  pc.fd_ticket_id         AS portal_fd_ticket_id,
  fdc.fd_contact_id       AS freshdesk_contact_id,
  fdc.name                AS freshdesk_contact_name,
  fdc.lifecycle_stage,
  fdc.sync_status         AS fd_contact_sync_status,
  ft.fd_ticket_id         AS freshdesk_ticket_id,
  ft.subject              AS freshdesk_ticket_subject,
  ft.status               AS freshdesk_ticket_status,
  ft.cnj_fase,
  -- Flags de sincronização
  (pc.fd_contact_id IS NOT NULL)                         AS tem_fd_contact,
  (pc.fd_ticket_id IS NOT NULL OR ft.id IS NOT NULL)     AS tem_fd_ticket,
  (fdc.id IS NOT NULL)                                   AS fd_contact_existe,
  -- Divergências
  (pc.fd_contact_id IS NOT NULL AND fdc.id IS NULL)      AS fd_contact_orphan,
  pc.created_at           AS caso_created_at,
  pc.updated_at           AS caso_updated_at
FROM portal_casos pc
LEFT JOIN freshdesk_contacts fdc
  ON fdc.fd_contact_id = pc.fd_contact_id
  OR fdc.email = (SELECT u.email FROM auth.users u WHERE u.id = pc.user_id)
LEFT JOIN freshdesk_tickets ft
  ON ft.portal_caso_id = pc.id
  OR ft.fd_ticket_id = pc.fd_ticket_id;

COMMENT ON VIEW vw_freshdesk_portal_sync IS
  'Estado de sincronização entre portal_casos e Freshdesk. Uso: monitoramento e reconciliação.';

-- ────────────────────────────────────────────────────────────
-- 5. Função RPC segura para busca do caso pelo cliente
--    (substitui acesso direto com join de auth.users)
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION rpc_get_meu_caso()
RETURNS TABLE (
  caso_id       UUID,
  fase          TEXT,
  onboarding_done BOOLEAN,
  cnj_step_atual  SMALLINT,
  full_name     TEXT,
  proxima_acao  TEXT,
  docs_total    BIGINT,
  docs_pendentes BIGINT,
  docs_aprovados BIGINT,
  timeline      JSONB,
  fd_ticket_id  BIGINT,
  workspace_slug TEXT
)
LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    pc.id,
    pc.fase,
    pc.onboarding_done,
    pc.cnj_step_atual,
    pc.full_name,
    pc.proxima_acao,
    COALESCE(docs.total,     0),
    COALESCE(docs.pendentes, 0),
    COALESCE(docs.aprovados, 0),
    -- Últimos 10 eventos visíveis
    COALESCE(
      (SELECT jsonb_agg(t ORDER BY t.created_at DESC)
       FROM (
         SELECT jsonb_build_object(
           'id',          tl.id,
           'tipo',        tl.evento_tipo,
           'descricao',   tl.descricao,
           'created_at',  tl.created_at
         ) AS t
         FROM portal_cnj_timeline tl
         WHERE tl.caso_id = pc.id
           AND tl.is_visible_client = true
         ORDER BY tl.created_at DESC
         LIMIT 10
       ) sub),
      '[]'::jsonb
    ),
    pc.fd_ticket_id,
    pw.slug
  FROM portal_casos pc
  LEFT JOIN portal_workspaces pw ON pw.id = pc.workspace_id
  LEFT JOIN LATERAL (
    SELECT
      COUNT(*)                                          AS total,
      COUNT(*) FILTER (WHERE status = 'pendente')       AS pendentes,
      COUNT(*) FILTER (WHERE status = 'aprovado')       AS aprovados
    FROM portal_documentos
    WHERE user_id = pc.user_id
  ) docs ON true
  WHERE pc.user_id = auth.uid()
  LIMIT 1;
END;
$$;

COMMENT ON FUNCTION rpc_get_meu_caso IS
  'RPC segura: retorna dados completos do caso do usuário autenticado, '
  'incluindo timeline e contadores de documentos. SECURITY DEFINER.';

-- ────────────────────────────────────────────────────────────
-- 6. Função RPC admin: busca consolidada por CPF
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION rpc_admin_busca_cpf(_cpf TEXT)
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Guard: apenas admins
  IF NOT is_any_admin() THEN
    RAISE EXCEPTION 'Acesso negado — função restrita a administradores';
  END IF;

  SELECT jsonb_build_object(
    'caso',         row_to_json(pc.*),
    'auth_email',   (SELECT email FROM auth.users WHERE id = pc.user_id),
    'fd_contact',   row_to_json(fdc.*),
    'docs',         (
      SELECT jsonb_agg(row_to_json(d.*))
      FROM portal_documentos d WHERE d.user_id = pc.user_id
    ),
    'timeline',     (
      SELECT jsonb_agg(row_to_json(tl.*) ORDER BY tl.created_at DESC)
      FROM portal_cnj_timeline tl WHERE tl.caso_id = pc.id
      LIMIT 20
    ),
    'ultimo_ticket', (
      SELECT row_to_json(ft.*)
      FROM freshdesk_tickets ft
      WHERE ft.portal_caso_id = pc.id
         OR ft.fd_contact_id = fdc.fd_contact_id
      ORDER BY ft.created_at DESC LIMIT 1
    )
  ) INTO v_result
  FROM portal_casos pc
  LEFT JOIN freshdesk_contacts fdc
    ON fdc.email = (SELECT email FROM auth.users WHERE id = pc.user_id)
  WHERE pc.cpf = regexp_replace(_cpf, '\D', '', 'g')
  LIMIT 1;

  RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$;

COMMENT ON FUNCTION rpc_admin_busca_cpf IS
  'Busca consolidada cross-sistema por CPF. Restrito a admins. Retorna caso+docs+timeline+ticket.';

-- ────────────────────────────────────────────────────────────
-- 7. Grants mínimos necessários
-- ────────────────────────────────────────────────────────────
GRANT SELECT ON vw_superendividamento_cliente    TO authenticated;
GRANT SELECT ON vw_cnj_dashboard_admin           TO authenticated;
GRANT SELECT ON vw_cnj_mapa_credores_analise     TO authenticated;
GRANT SELECT ON vw_freshdesk_portal_sync         TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_get_meu_caso       TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_admin_busca_cpf    TO authenticated;

-- Views das novas tabelas
GRANT SELECT, INSERT ON portal_cnj_timeline      TO authenticated;
GRANT SELECT ON portal_cnj_notifications         TO authenticated;
GRANT ALL ON portal_workspaces                   TO authenticated;
GRANT ALL ON portal_workspace_members            TO authenticated;

-- ────────────────────────────────────────────────────────────
-- DOWN
-- ────────────────────────────────────────────────────────────
-- DROP VIEW IF EXISTS vw_superendividamento_cliente;
-- DROP VIEW IF EXISTS vw_cnj_dashboard_admin;
-- DROP VIEW IF EXISTS vw_cnj_mapa_credores_analise;
-- DROP VIEW IF EXISTS vw_freshdesk_portal_sync;
-- DROP FUNCTION IF EXISTS rpc_get_meu_caso;
-- DROP FUNCTION IF EXISTS rpc_admin_busca_cpf;
