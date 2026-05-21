-- =============================================================================
-- MIGRATION 000 — Fundação do Portal CNJ (tabelas core + funções de autorização)
-- Portal: Hermida Maia Advocacia — Superendividamento CNJ
-- =============================================================================
-- Cria todas as tabelas core que as migrations 001–011 pressupõem existir.
-- Idempotente: CREATE TABLE/FUNCTION IF NOT EXISTS + OR REPLACE em tudo.
-- =============================================================================

-- ─── 0. Funções auxiliares ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION _set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- ─── 1. admin_users ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_users (
  user_id     uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role        text NOT NULL DEFAULT 'admin',  -- admin|platform_admin|support
  created_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='admin_users' AND policyname='admin_read_self') THEN
    CREATE POLICY admin_read_self ON admin_users FOR SELECT TO authenticated USING (user_id = auth.uid());
  END IF;
END $$;

-- ─── 2. Funções de autorização ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION is_any_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION is_platform_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND role = 'platform_admin'
  );
$$;

-- ─── 3. portal_workspaces ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS portal_workspaces (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text NOT NULL UNIQUE,
  name        text NOT NULL,
  owner_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  plan        text NOT NULL DEFAULT 'standard',
  status      text NOT NULL DEFAULT 'active',
  settings    jsonb NOT NULL DEFAULT '{}',
  metadata    jsonb NOT NULL DEFAULT '{}',
  extra_data  jsonb NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_portal_workspaces_slug     ON portal_workspaces(slug);
CREATE INDEX IF NOT EXISTS idx_portal_workspaces_owner_id ON portal_workspaces(owner_id);

DROP TRIGGER IF EXISTS trg_portal_workspaces_updated_at ON portal_workspaces;
CREATE TRIGGER trg_portal_workspaces_updated_at
  BEFORE UPDATE ON portal_workspaces FOR EACH ROW EXECUTE FUNCTION _set_updated_at();

ALTER TABLE portal_workspaces ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='portal_workspaces' AND policyname='admin_workspaces') THEN
    CREATE POLICY admin_workspaces ON portal_workspaces FOR ALL TO authenticated USING (is_any_admin());
  END IF;
END $$;

-- Seed: workspace padrão do escritório
INSERT INTO portal_workspaces (slug, name, plan, status)
VALUES ('hmadv-principal', 'Hermida Maia Advocacia', 'enterprise', 'active')
ON CONFLICT (slug) DO NOTHING;

-- ─── 4. portal_workspace_members ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS portal_workspace_members (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES portal_workspaces(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role         text NOT NULL DEFAULT 'member',
  is_active    boolean NOT NULL DEFAULT true,
  invited_by   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  joined_at    timestamptz NOT NULL DEFAULT now(),
  metadata     jsonb NOT NULL DEFAULT '{}',
  UNIQUE (workspace_id, user_id)
);
ALTER TABLE portal_workspace_members ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='portal_workspace_members' AND policyname='admin_workspace_members') THEN
    CREATE POLICY admin_workspace_members ON portal_workspace_members FOR ALL TO authenticated USING (is_any_admin());
  END IF;
END $$;

-- ─── 5. portal_casos ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS portal_casos (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id              uuid REFERENCES portal_workspaces(id) ON DELETE SET NULL,

  -- Dados pessoais
  full_name                 text,
  cpf                       text,
  data_nascimento           date,
  sexo                      text,
  estado_civil              text,
  profissao                 text,
  situacao_profissional     text,
  telefones                 jsonb DEFAULT '[]',
  enderecos                 jsonb DEFAULT '[]',

  -- RG
  rg_numero                 text,
  rg_orgao_emissor          text,
  rg_emissor                text,
  rg_data_emissao           date,

  -- Financeiro
  renda                     decimal(12,2),
  renda_familiar            decimal(12,2),
  n_dependentes             integer,
  n_credores                integer,
  divida_total_estimada     decimal(14,2),
  comprometimento_mensal    decimal(12,2),
  despesas                  jsonb DEFAULT '{}',
  patrimonio                jsonb DEFAULT '{}',

  -- CNJ Formulário
  causas_endividamento      jsonb DEFAULT '[]',
  negativacoes              jsonb DEFAULT '{}',
  conhecimento_credito      jsonb DEFAULT '[]',
  credores_cnj              jsonb DEFAULT '[]',
  plano_pagamento           jsonb DEFAULT '{}',
  cnj_json                  jsonb DEFAULT '{}',
  cnj_step_atual            smallint DEFAULT 1,
  cnj_form_id               uuid,
  cnj_response_id           uuid,

  -- Fase e status
  fase                      text NOT NULL DEFAULT 'cadastro',
  onboarding_done           boolean NOT NULL DEFAULT false,
  proxima_acao              text,

  -- Pontes externas
  re_user_id                uuid,
  fd_contact_id             bigint,
  fd_ticket_id              bigint,
  fs_contact_id             text,
  processo_judicial_id      uuid,

  -- Extensões
  metadata                  jsonb NOT NULL DEFAULT '{}',
  extra_data                jsonb NOT NULL DEFAULT '{}',
  settings                  jsonb NOT NULL DEFAULT '{}',

  -- Audit
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_portal_casos_user_id     ON portal_casos(user_id);
CREATE INDEX IF NOT EXISTS idx_portal_casos_workspace   ON portal_casos(workspace_id) WHERE workspace_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_portal_casos_fase        ON portal_casos(fase);
CREATE INDEX IF NOT EXISTS idx_portal_casos_cpf         ON portal_casos(cpf) WHERE cpf IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_portal_casos_cnj_step    ON portal_casos(cnj_step_atual);
CREATE INDEX IF NOT EXISTS idx_portal_casos_re_user_id  ON portal_casos(re_user_id) WHERE re_user_id IS NOT NULL;

DROP TRIGGER IF EXISTS trg_portal_casos_updated_at ON portal_casos;
CREATE TRIGGER trg_portal_casos_updated_at
  BEFORE UPDATE ON portal_casos FOR EACH ROW EXECUTE FUNCTION _set_updated_at();

ALTER TABLE portal_casos ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='portal_casos' AND policyname='own_caso') THEN
    CREATE POLICY own_caso ON portal_casos FOR ALL TO authenticated
      USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='portal_casos' AND policyname='admin_all_casos') THEN
    CREATE POLICY admin_all_casos ON portal_casos FOR ALL TO authenticated USING (is_any_admin());
  END IF;
END $$;

-- ─── 6. portal_documentos ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS portal_documentos (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id        uuid REFERENCES portal_workspaces(id) ON DELETE SET NULL,
  tipo                text NOT NULL,
  nome_arquivo        text,
  storage_path        text,
  status              text NOT NULL DEFAULT 'pendente',
  observacao          text,
  observacao_admin    text,
  re_document_id      uuid,
  metadata            jsonb NOT NULL DEFAULT '{}',
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, tipo)
);

CREATE INDEX IF NOT EXISTS idx_portal_docs_user_id ON portal_documentos(user_id);
CREATE INDEX IF NOT EXISTS idx_portal_docs_status  ON portal_documentos(status);
CREATE INDEX IF NOT EXISTS idx_portal_docs_workspace ON portal_documentos(workspace_id) WHERE workspace_id IS NOT NULL;

DROP TRIGGER IF EXISTS trg_portal_docs_updated_at ON portal_documentos;
CREATE TRIGGER trg_portal_docs_updated_at
  BEFORE UPDATE ON portal_documentos FOR EACH ROW EXECUTE FUNCTION _set_updated_at();

ALTER TABLE portal_documentos ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='portal_documentos' AND policyname='own_docs') THEN
    CREATE POLICY own_docs ON portal_documentos FOR ALL TO authenticated
      USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='portal_documentos' AND policyname='admin_all_docs') THEN
    CREATE POLICY admin_all_docs ON portal_documentos FOR ALL TO authenticated USING (is_any_admin());
  END IF;
END $$;

-- ─── 7. portal_dividas ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS portal_dividas (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id    uuid REFERENCES portal_workspaces(id) ON DELETE SET NULL,
  credor          text,
  tipo            text,
  valor           decimal(14,2),
  vencimento      date,
  status          text NOT NULL DEFAULT 'em_aberto',
  observacao      text,
  metadata        jsonb NOT NULL DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_portal_dividas_user_id   ON portal_dividas(user_id);
CREATE INDEX IF NOT EXISTS idx_portal_dividas_workspace ON portal_dividas(workspace_id) WHERE workspace_id IS NOT NULL;

DROP TRIGGER IF EXISTS trg_portal_dividas_updated_at ON portal_dividas;
CREATE TRIGGER trg_portal_dividas_updated_at
  BEFORE UPDATE ON portal_dividas FOR EACH ROW EXECUTE FUNCTION _set_updated_at();

ALTER TABLE portal_dividas ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='portal_dividas' AND policyname='own_dividas') THEN
    CREATE POLICY own_dividas ON portal_dividas FOR ALL TO authenticated
      USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='portal_dividas' AND policyname='admin_all_dividas') THEN
    CREATE POLICY admin_all_dividas ON portal_dividas FOR ALL TO authenticated USING (is_any_admin());
  END IF;
END $$;

-- ─── 8. portal_cnj_timeline ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS portal_cnj_timeline (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caso_id          uuid NOT NULL REFERENCES portal_casos(id) ON DELETE CASCADE,
  workspace_id     uuid REFERENCES portal_workspaces(id) ON DELETE SET NULL,
  evento_tipo      text NOT NULL,
  evento_subtipo   text,
  descricao        text,
  payload          jsonb NOT NULL DEFAULT '{}',
  author_role      text NOT NULL DEFAULT 'system',
  author_uid       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  is_visible_client boolean NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_timeline_caso_id ON portal_cnj_timeline(caso_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_timeline_workspace ON portal_cnj_timeline(workspace_id, created_at DESC);

ALTER TABLE portal_cnj_timeline ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='portal_cnj_timeline' AND policyname='client_visible_timeline') THEN
    CREATE POLICY client_visible_timeline ON portal_cnj_timeline FOR SELECT TO authenticated
      USING (is_visible_client = true AND caso_id IN (SELECT id FROM portal_casos WHERE user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='portal_cnj_timeline' AND policyname='admin_all_timeline') THEN
    CREATE POLICY admin_all_timeline ON portal_cnj_timeline FOR ALL TO authenticated USING (is_any_admin());
  END IF;
END $$;

-- ─── 9. portal_cnj_notifications ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS portal_cnj_notifications (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caso_id          uuid REFERENCES portal_casos(id) ON DELETE CASCADE,
  workspace_id     uuid REFERENCES portal_workspaces(id) ON DELETE SET NULL,
  recipient_uid    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_email  text,
  canal            text NOT NULL DEFAULT 'email',
  assunto          text,
  template_key     text,
  template_vars    jsonb NOT NULL DEFAULT '{}',
  status           text NOT NULL DEFAULT 'pendente',
  sent_at          timestamptz,
  error_msg        text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notif_recipient ON portal_cnj_notifications(recipient_uid);
CREATE INDEX IF NOT EXISTS idx_notif_status    ON portal_cnj_notifications(status, created_at);

DROP TRIGGER IF EXISTS trg_portal_notif_updated_at ON portal_cnj_notifications;
CREATE TRIGGER trg_portal_notif_updated_at
  BEFORE UPDATE ON portal_cnj_notifications FOR EACH ROW EXECUTE FUNCTION _set_updated_at();

ALTER TABLE portal_cnj_notifications ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='portal_cnj_notifications' AND policyname='own_notifications') THEN
    CREATE POLICY own_notifications ON portal_cnj_notifications FOR SELECT TO authenticated
      USING (recipient_uid = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='portal_cnj_notifications' AND policyname='admin_all_notifications') THEN
    CREATE POLICY admin_all_notifications ON portal_cnj_notifications FOR ALL TO authenticated USING (is_any_admin());
  END IF;
END $$;

-- ─── 10. freshdesk_tickets (espelho mínimo) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS freshdesk_tickets (
  id              bigserial PRIMARY KEY,
  fd_ticket_id    bigint UNIQUE,
  portal_caso_id  uuid REFERENCES portal_casos(id) ON DELETE SET NULL,
  subject         text,
  status          integer DEFAULT 2,
  priority        integer DEFAULT 1,
  cnj_fase        text,
  requester_email text,
  tags            text[],
  metadata        jsonb NOT NULL DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE freshdesk_tickets ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='freshdesk_tickets' AND policyname='admin_read_tickets') THEN
    CREATE POLICY admin_read_tickets ON freshdesk_tickets FOR ALL TO authenticated USING (is_any_admin());
  END IF;
END $$;

-- ─── 11. freshdesk_contacts (espelho mínimo) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS freshdesk_contacts (
  id              bigserial PRIMARY KEY,
  fd_contact_id   bigint UNIQUE,
  email           text,
  name            text,
  phone           text,
  sync_status     text DEFAULT 'pending',
  metadata        jsonb NOT NULL DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE freshdesk_contacts ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='freshdesk_contacts' AND policyname='admin_read_contacts_fd') THEN
    CREATE POLICY admin_read_contacts_fd ON freshdesk_contacts FOR ALL TO authenticated USING (is_any_admin());
  END IF;
END $$;

-- ─── 12. RPC: rpc_get_meu_caso ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION rpc_get_meu_caso()
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  result json;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  SELECT json_build_object(
    'caso',       row_to_json(pc),
    'timeline',   (SELECT json_agg(t ORDER BY t.created_at DESC)
                   FROM portal_cnj_timeline t
                   WHERE t.caso_id = pc.id AND t.is_visible_client = true),
    'docs_total', (SELECT COUNT(*) FROM portal_documentos WHERE user_id = v_uid),
    'docs_aprovados', (SELECT COUNT(*) FROM portal_documentos WHERE user_id = v_uid AND status = 'aprovado'),
    'docs_pendentes', (SELECT COUNT(*) FROM portal_documentos WHERE user_id = v_uid AND status = 'pendente')
  ) INTO result
  FROM portal_casos pc
  WHERE pc.user_id = v_uid
  LIMIT 1;
  RETURN result;
END;
$$;
GRANT EXECUTE ON FUNCTION rpc_get_meu_caso() TO authenticated;

-- ─── 13. RPCs admin ───────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION admin_get_stats()
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE result json;
BEGIN
  IF NOT is_any_admin() THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  SELECT json_build_object(
    'total_clientes',   (SELECT COUNT(*) FROM portal_casos),
    'onboarding_done',  (SELECT COUNT(*) FROM portal_casos WHERE onboarding_done = true),
    'cnj_finalizado',   (SELECT COUNT(*) FROM portal_casos WHERE cnj_step_atual >= 7),
    'fase_cadastro',    (SELECT COUNT(*) FROM portal_casos WHERE fase = 'cadastro'),
    'fase_analise',     (SELECT COUNT(*) FROM portal_casos WHERE fase = 'analise'),
    'fase_conciliacao', (SELECT COUNT(*) FROM portal_casos WHERE fase = 'conciliacao'),
    'fase_judicial',    (SELECT COUNT(*) FROM portal_casos WHERE fase = 'judicial'),
    'fase_encerrado',   (SELECT COUNT(*) FROM portal_casos WHERE fase = 'encerrado'),
    'total_dividas',    (SELECT COALESCE(SUM(valor),0) FROM portal_dividas),
    'docs_em_analise',  (SELECT COUNT(*) FROM portal_documentos WHERE status = 'em_analise'),
    'docs_aprovados',   (SELECT COUNT(*) FROM portal_documentos WHERE status = 'aprovado'),
    'docs_pendentes',   (SELECT COUNT(*) FROM portal_documentos WHERE status = 'pendente'),
    'docs_recusados',   (SELECT COUNT(*) FROM portal_documentos WHERE status = 'recusado'),
    'tickets_abertos',  (SELECT COUNT(*) FROM freshdesk_tickets WHERE status IN (2,3)),
    'tickets_total',    (SELECT COUNT(*) FROM freshdesk_tickets),
    'eventos_7d',       (SELECT COUNT(*) FROM portal_cnj_timeline WHERE created_at > now() - interval '7 days'),
    'notificacoes_pendentes', (SELECT COUNT(*) FROM portal_cnj_notifications WHERE status = 'pendente'),
    'workspaces_ativos',(SELECT COUNT(*) FROM portal_workspaces WHERE status = 'active')
  ) INTO result;
  RETURN result;
END;
$$;
GRANT EXECUTE ON FUNCTION admin_get_stats() TO authenticated;

DROP FUNCTION IF EXISTS admin_get_clients();
CREATE OR REPLACE FUNCTION admin_get_clients()
RETURNS TABLE(
  user_id          uuid,
  email            text,
  full_name        text,
  cpf              text,
  fase             text,
  onboarding_done  boolean,
  cnj_step_atual   smallint,
  n_credores       integer,
  fd_ticket_id     bigint,
  workspace_id     uuid,
  workspace_slug   text,
  total_dividas    numeric,
  docs_aprovados   bigint,
  docs_pendentes   bigint,
  created_at       timestamptz
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT is_any_admin() THEN RAISE EXCEPTION 'Unauthorized'; END IF;
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
    COALESCE(dc.aprovados, 0),
    COALESCE(dc.pendentes, 0),
    pc.created_at
  FROM portal_casos pc
  JOIN  auth.users au ON au.id = pc.user_id
  LEFT  JOIN portal_workspaces pw ON pw.id = pc.workspace_id
  LEFT  JOIN LATERAL (SELECT SUM(valor) AS total_dividas FROM portal_dividas WHERE user_id = pc.user_id) dv ON true
  LEFT  JOIN LATERAL (
    SELECT
      COUNT(*) FILTER (WHERE status = 'aprovado') AS aprovados,
      COUNT(*) FILTER (WHERE status = 'pendente') AS pendentes
    FROM portal_documentos WHERE user_id = pc.user_id
  ) dc ON true
  ORDER BY pc.created_at DESC;
END;
$$;
GRANT EXECUTE ON FUNCTION admin_get_clients() TO authenticated;

-- ─── 14. Grants globais ───────────────────────────────────────────────────────
GRANT SELECT ON portal_workspaces TO authenticated;
GRANT ALL    ON portal_casos      TO authenticated;
GRANT ALL    ON portal_documentos TO authenticated;
GRANT ALL    ON portal_dividas    TO authenticated;
GRANT SELECT, INSERT ON portal_cnj_timeline TO authenticated;
GRANT SELECT         ON portal_cnj_notifications TO authenticated;

-- =============================================================================
-- FIM DA MIGRATION 000
-- =============================================================================
