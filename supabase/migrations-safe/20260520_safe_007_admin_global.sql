-- =============================================================================
-- MIGRATION 007 — Admin global view + RPCs aprimorados
-- Portal: Hermida Maia Advocacia — Superendividamento CNJ
-- =============================================================================
-- REGRAS ABSOLUTAS: CREATE OR REPLACE, sem DROP, compatibilidade retroativa
-- OBJETIVO:
--   1. vw_admin_global — dashboard agregado por workspace (platform-level)
--   2. vw_admin_casos_detalhado — lista enriquecida de casos para admin
--   3. admin_get_stats() — upgrade para métricas mais ricas
--   4. admin_get_clients() — upgrade com workspace, dividas, docs
--   5. rpc_admin_workspace_stats(p_workspace_id) — drill-down por workspace
-- =============================================================================

-- ─── 1. vw_admin_global — agregação por workspace ───────────────────────────
CREATE OR REPLACE VIEW vw_admin_global
WITH (security_barrier = true)
AS
SELECT
  -- Workspace identity
  pw.id                 AS workspace_id,
  pw.slug               AS workspace_slug,
  pw.name               AS workspace_name,
  pw.plan               AS workspace_plan,
  pw.status             AS workspace_status,

  -- Casos / fases
  COUNT(DISTINCT pc.id)                                                   AS total_casos,
  COUNT(DISTINCT pc.id) FILTER (WHERE pc.onboarding_done)                 AS casos_concluidos,
  COUNT(DISTINCT pc.id) FILTER (WHERE NOT pc.onboarding_done)             AS casos_incompletos,
  COUNT(DISTINCT pc.id) FILTER (WHERE pc.fase = 'cadastro')               AS fase_cadastro,
  COUNT(DISTINCT pc.id) FILTER (WHERE pc.fase = 'analise')                AS fase_analise,
  COUNT(DISTINCT pc.id) FILTER (WHERE pc.fase = 'conciliacao')            AS fase_conciliacao,
  COUNT(DISTINCT pc.id) FILTER (WHERE pc.fase = 'judicial')               AS fase_judicial,
  COUNT(DISTINCT pc.id) FILTER (WHERE pc.fase = 'encerrado')              AS fase_encerrado,
  COUNT(DISTINCT pc.id) FILTER (WHERE pc.cnj_step_atual >= 7)             AS cnj_finalizado,

  -- Financeiro (dividas CNJ — campo jsonb credores_cnj)
  COALESCE((
    SELECT SUM(COALESCE((c.value->>'valorDeclarado')::numeric, 0))
    FROM   portal_casos pc2
    JOIN   jsonb_array_elements(pc2.credores_cnj) c ON true
    WHERE  pc2.workspace_id = pw.id
  ), 0)::numeric(18,2)  AS total_dividas_declaradas,

  COALESCE(AVG(pc.renda),         0)::numeric(12,2) AS renda_media,
  COALESCE(AVG(pc.renda_familiar),0)::numeric(12,2) AS renda_familiar_media,

  -- Pipeline de documentos
  COUNT(DISTINCT pdoc.id)                                                  AS total_documentos,
  COUNT(DISTINCT pdoc.id) FILTER (WHERE pdoc.status = 'aprovado')         AS docs_aprovados,
  COUNT(DISTINCT pdoc.id) FILTER (WHERE pdoc.status = 'em_analise')       AS docs_em_analise,
  COUNT(DISTINCT pdoc.id) FILTER (WHERE pdoc.status = 'pendente')         AS docs_pendentes,
  COUNT(DISTINCT pdoc.id) FILTER (WHERE pdoc.status = 'recusado')         AS docs_recusados,

  -- Freshdesk tickets
  COUNT(DISTINCT ft.id)                                                    AS tickets_total,
  COUNT(DISTINCT ft.id) FILTER (WHERE ft.status IN (2,3))                 AS tickets_abertos,
  COUNT(DISTINCT ft.id) FILTER (WHERE ft.status = 4)                      AS tickets_resolvidos,

  -- Timeline activity
  COUNT(DISTINCT tl.id)                                                    AS total_eventos_timeline,
  COUNT(DISTINCT tl.id) FILTER (WHERE tl.created_at > now() - interval '7 days') AS eventos_ultimos_7d,
  MAX(tl.created_at)                                                       AS ultimo_evento_at,

  -- Notificações pendentes
  COUNT(DISTINCT ntf.id) FILTER (WHERE ntf.status = 'pendente')           AS notificacoes_pendentes,

  -- Membros do workspace (equipe interna)
  COUNT(DISTINCT pwm.user_id)                                              AS total_membros_equipe,

  pw.created_at   AS workspace_criado_em,
  pw.updated_at   AS workspace_atualizado_em

FROM   portal_workspaces pw
LEFT   JOIN portal_casos pc     ON pc.workspace_id = pw.id
LEFT   JOIN portal_documentos pdoc
            ON pdoc.user_id = pc.user_id
LEFT   JOIN freshdesk_tickets ft
            ON ft.portal_caso_id = pc.id
LEFT   JOIN portal_cnj_timeline tl
            ON tl.caso_id = pc.id
LEFT   JOIN portal_cnj_notifications ntf
            ON ntf.caso_id = pc.id
LEFT   JOIN portal_workspace_members pwm
            ON pwm.workspace_id = pw.id AND pwm.is_active = true
GROUP  BY pw.id, pw.slug, pw.name, pw.plan, pw.status,
          pw.created_at, pw.updated_at;

GRANT SELECT ON vw_admin_global TO authenticated;

COMMENT ON VIEW vw_admin_global
  IS 'Dashboard platform-level: uma linha por workspace com todos os KPIs. Ler apenas via is_any_admin() no frontend ou RPC.';

-- ─── 2. vw_admin_casos_detalhado — lista enriquecida de casos ───────────────
CREATE OR REPLACE VIEW vw_admin_casos_detalhado
WITH (security_barrier = true)
AS
SELECT
  pc.id               AS caso_id,
  pc.user_id          AS auth_uid,
  au.email            AS cliente_email,
  pc.workspace_id,
  pw.slug             AS workspace_slug,
  pw.name             AS workspace_name,

  -- Dados pessoais
  pc.full_name,
  pc.cpf,
  pc.data_nascimento,
  pc.sexo,
  pc.estado_civil,
  pc.profissao,
  pc.situacao_profissional,
  pc.telefones,
  pc.enderecos,

  -- Financeiro
  pc.renda,
  pc.renda_familiar,
  pc.n_dependentes,
  pc.n_credores,
  pc.divida_total_estimada,

  -- Progresso CNJ
  pc.fase,
  pc.cnj_step_atual,
  pc.onboarding_done,
  pc.proxima_acao,

  -- Links externos
  pc.fd_ticket_id,
  pc.fd_contact_id,
  pc.fs_contact_id,
  pc.re_user_id,

  -- Contadores calculados
  COALESCE(docs.total,     0) AS docs_total,
  COALESCE(docs.aprovados, 0) AS docs_aprovados,
  COALESCE(docs.pendentes, 0) AS docs_pendentes,
  COALESCE(docs.em_analise,0) AS docs_em_analise,

  COALESCE(divs.total_dividas, 0)::numeric(14,2) AS total_dividas,
  COALESCE(divs.qtd_dividas,   0)                AS qtd_dividas,

  -- Timeline
  COALESCE(tl.total_eventos, 0) AS total_eventos,
  tl.ultimo_evento_at,
  tl.ultimo_evento_tipo,

  -- Freshdesk
  ft.status           AS fd_ticket_status,
  ft.cnj_fase         AS fd_cnj_fase,
  ft.subject          AS fd_ticket_subject,

  -- Audit
  pc.created_at,
  pc.updated_at,

  -- Metadados
  pc.metadata,
  pc.extra_data

FROM portal_casos pc
JOIN   auth.users au ON au.id = pc.user_id
LEFT   JOIN portal_workspaces pw ON pw.id = pc.workspace_id
LEFT   JOIN freshdesk_tickets ft ON ft.portal_caso_id = pc.id
LEFT   JOIN LATERAL (
  SELECT
    COUNT(*)                                          AS total,
    COUNT(*) FILTER (WHERE status = 'aprovado')       AS aprovados,
    COUNT(*) FILTER (WHERE status = 'pendente')       AS pendentes,
    COUNT(*) FILTER (WHERE status = 'em_analise')     AS em_analise
  FROM portal_documentos WHERE user_id = pc.user_id
) docs ON true
LEFT   JOIN LATERAL (
  SELECT
    SUM(valor)  AS total_dividas,
    COUNT(*)    AS qtd_dividas
  FROM portal_dividas WHERE user_id = pc.user_id
) divs ON true
LEFT   JOIN LATERAL (
  SELECT
    COUNT(*)                                 AS total_eventos,
    MAX(created_at)                          AS ultimo_evento_at,
    (SELECT evento_tipo FROM portal_cnj_timeline
     WHERE caso_id = pc.id ORDER BY created_at DESC LIMIT 1) AS ultimo_evento_tipo
  FROM portal_cnj_timeline WHERE caso_id = pc.id
) tl ON true;

GRANT SELECT ON vw_admin_casos_detalhado TO authenticated;

COMMENT ON VIEW vw_admin_casos_detalhado
  IS 'Lista enriquecida de casos para admin. Cada linha = 1 caso com todos os KPIs. Substituir consultas manuais com múltiplos JOINs.';

-- ─── 3. Upgrade admin_get_stats() ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION admin_get_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE result json;
BEGIN
  IF NOT is_any_admin() THEN
    RAISE EXCEPTION 'Unauthorized: admin_get_stats requer is_any_admin()';
  END IF;

  SELECT json_build_object(
    -- Clientes e progresso
    'total_clientes',        (SELECT COUNT(*)               FROM portal_casos),
    'onboarding_done',       (SELECT COUNT(*)               FROM portal_casos WHERE onboarding_done = true),
    'cnj_finalizado',        (SELECT COUNT(*)               FROM portal_casos WHERE cnj_step_atual >= 7),

    -- Fases
    'fase_cadastro',         (SELECT COUNT(*)               FROM portal_casos WHERE fase = 'cadastro'),
    'fase_analise',          (SELECT COUNT(*)               FROM portal_casos WHERE fase = 'analise'),
    'fase_conciliacao',      (SELECT COUNT(*)               FROM portal_casos WHERE fase = 'conciliacao'),
    'fase_judicial',         (SELECT COUNT(*)               FROM portal_casos WHERE fase = 'judicial'),
    'fase_encerrado',        (SELECT COUNT(*)               FROM portal_casos WHERE fase = 'encerrado'),

    -- Financeiro
    'total_dividas',         (SELECT COALESCE(SUM(valor),0) FROM portal_dividas),

    -- Documentos
    'docs_em_analise',       (SELECT COUNT(*)               FROM portal_documentos WHERE status = 'em_analise'),
    'docs_aprovados',        (SELECT COUNT(*)               FROM portal_documentos WHERE status = 'aprovado'),
    'docs_pendentes',        (SELECT COUNT(*)               FROM portal_documentos WHERE status = 'pendente'),
    'docs_recusados',        (SELECT COUNT(*)               FROM portal_documentos WHERE status = 'recusado'),

    -- Freshdesk
    'tickets_abertos',       (SELECT COUNT(*)               FROM freshdesk_tickets WHERE status IN (2,3)),
    'tickets_resolvidos',    (SELECT COUNT(*)               FROM freshdesk_tickets WHERE status = 4),
    'tickets_total',         (SELECT COUNT(*)               FROM freshdesk_tickets),

    -- Timeline e atividade
    'eventos_hoje',          (SELECT COUNT(*)               FROM portal_cnj_timeline WHERE created_at > now() - interval '24 hours'),
    'eventos_7d',            (SELECT COUNT(*)               FROM portal_cnj_timeline WHERE created_at > now() - interval '7 days'),
    'notificacoes_pendentes',(SELECT COUNT(*)               FROM portal_cnj_notifications WHERE status = 'pendente'),

    -- Infra
    'workspaces_ativos',     (SELECT COUNT(*)               FROM portal_workspaces WHERE status = 'active'),
    'freshdesk_contacts_synced', (SELECT COUNT(*)           FROM freshdesk_contacts WHERE sync_status = 'synced')
  ) INTO result;

  RETURN result;
END;
$$;

-- ─── 4. Upgrade admin_get_clients() ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION admin_get_clients()
RETURNS TABLE(
  user_id         uuid,
  email           text,
  full_name       text,
  cpf             text,
  fase            text,
  onboarding_done boolean,
  cnj_step_atual  smallint,
  n_credores      integer,
  fd_ticket_id    bigint,
  workspace_id    uuid,
  workspace_slug  text,
  total_dividas   numeric,
  docs_aprovados  bigint,
  docs_pendentes  bigint,
  created_at      timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_any_admin() THEN
    RAISE EXCEPTION 'Unauthorized: admin_get_clients requer is_any_admin()';
  END IF;

  RETURN QUERY
  SELECT
    pc.user_id,
    au.email::text,
    pc.full_name,
    pc.cpf,
    pc.fase,
    pc.onboarding_done,
    pc.cnj_step_atual,
    pc.n_credores,
    pc.fd_ticket_id,
    pc.workspace_id,
    pw.slug,
    COALESCE(dv.total_dividas, 0)::numeric,
    COALESCE(dc.aprovados,     0),
    COALESCE(dc.pendentes,     0),
    pc.created_at
  FROM portal_casos pc
  JOIN  auth.users au ON au.id = pc.user_id
  LEFT  JOIN portal_workspaces pw ON pw.id = pc.workspace_id
  LEFT  JOIN LATERAL (
    SELECT SUM(valor) AS total_dividas
    FROM   portal_dividas WHERE user_id = pc.user_id
  ) dv ON true
  LEFT  JOIN LATERAL (
    SELECT
      COUNT(*) FILTER (WHERE status = 'aprovado') AS aprovados,
      COUNT(*) FILTER (WHERE status = 'pendente') AS pendentes
    FROM portal_documentos WHERE user_id = pc.user_id
  ) dc ON true
  ORDER BY pc.created_at DESC;
END;
$$;

-- ─── 5. RPC: drill-down por workspace ────────────────────────────────────────
CREATE OR REPLACE FUNCTION rpc_admin_workspace_stats(p_workspace_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE result json;
BEGIN
  IF NOT is_any_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT row_to_json(g) INTO result
  FROM vw_admin_global g
  WHERE workspace_id = p_workspace_id
  LIMIT 1;

  RETURN COALESCE(result, '{}'::json);
END;
$$;

GRANT EXECUTE ON FUNCTION rpc_admin_workspace_stats(uuid) TO authenticated;

COMMENT ON FUNCTION rpc_admin_workspace_stats(uuid)
  IS 'Retorna métricas detalhadas de um workspace específico para admin';

-- =============================================================================
-- REVERSÃO:
-- DROP VIEW IF EXISTS vw_admin_global;
-- DROP VIEW IF EXISTS vw_admin_casos_detalhado;
-- DROP FUNCTION IF EXISTS rpc_admin_workspace_stats(uuid);
-- (admin_get_stats e admin_get_clients voltam ao estado anterior com CREATE OR REPLACE)
-- =============================================================================
