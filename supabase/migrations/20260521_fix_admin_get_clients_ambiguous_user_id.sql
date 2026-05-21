-- Fix admin_get_clients() ambiguous user_id reference (Postgres 42702)
-- Root cause: unqualified user_id in PL/pgSQL function that also exposes user_id in RETURNS TABLE

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
  JOIN auth.users au ON au.id = pc.user_id
  LEFT JOIN portal_workspaces pw ON pw.id = pc.workspace_id
  LEFT JOIN LATERAL (
    SELECT SUM(pd.valor) AS total_dividas
    FROM portal_dividas pd
    WHERE pd.user_id = pc.user_id
  ) dv ON true
  LEFT JOIN LATERAL (
    SELECT
      COUNT(*) FILTER (WHERE pdoc.status = 'aprovado') AS aprovados,
      COUNT(*) FILTER (WHERE pdoc.status = 'pendente') AS pendentes
    FROM portal_documentos pdoc
    WHERE pdoc.user_id = pc.user_id
  ) dc ON true
  ORDER BY pc.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION admin_get_clients() TO authenticated;
