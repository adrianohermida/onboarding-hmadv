-- Add p_search / p_limit / p_offset to admin_get_clients()
-- Root cause: callers in apps/web pass these params; function had none → PostgREST error.
-- Also switches doc-count filters to workflow_status (added by safe_012 enterprise migration).

CREATE OR REPLACE FUNCTION admin_get_clients(
  p_search TEXT DEFAULT NULL,
  p_limit  INT  DEFAULT 50,
  p_offset INT  DEFAULT 0
)
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
  JOIN auth.users au ON au.id = pc.user_id
  LEFT JOIN portal_workspaces pw ON pw.id = pc.workspace_id
  LEFT JOIN LATERAL (
    SELECT SUM(pd.valor) AS total_dividas
    FROM portal_dividas pd
    WHERE pd.user_id = pc.user_id
  ) dv ON true
  LEFT JOIN LATERAL (
    SELECT
      COUNT(*) FILTER (WHERE pdoc.workflow_status = 'aprovado')       AS aprovados,
      COUNT(*) FILTER (WHERE pdoc.workflow_status = 'pendente_envio') AS pendentes
    FROM portal_documentos pdoc
    WHERE pdoc.user_id = pc.user_id
  ) dc ON true
  WHERE (
    p_search IS NULL
    OR pc.full_name ILIKE '%' || p_search || '%'
    OR au.email     ILIKE '%' || p_search || '%'
    OR pc.cpf       ILIKE '%' || p_search || '%'
  )
  ORDER BY pc.created_at DESC
  LIMIT  p_limit
  OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION admin_get_clients(TEXT, INT, INT) TO authenticated;
