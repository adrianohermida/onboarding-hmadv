-- =============================================================================
-- MIGRATION 011 — Auditoria de Downloads de Arquivos (PDFs e Assets)
-- Portal: Hermida Maia Advocacia — Superendividamento CNJ
-- =============================================================================
-- REGRAS ABSOLUTAS: CREATE IF NOT EXISTS, sem DROP, sem RENAME
-- OBJETIVO:
--   1. portal_download_audit — log imutável de cada download realizado
--   2. RPC rpc_log_download() — SECURITY DEFINER para garantir inserção
--   3. View vw_admin_download_audit — painel de downloads para admin
-- =============================================================================

-- ─── 1. portal_download_audit — Log imutável de downloads ───────────────────
CREATE TABLE IF NOT EXISTS portal_download_audit (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Quem baixou
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  caso_id         uuid        REFERENCES portal_casos(id) ON DELETE SET NULL,
  workspace_id    uuid        REFERENCES portal_workspaces(id) ON DELETE SET NULL,

  -- O que foi baixado
  asset_key       text        NOT NULL,  -- ex: 'cartilha_superendividamento', 'anexo_ii_cnj'
  asset_type      text        NOT NULL DEFAULT 'pdf'
                  CHECK (asset_type IN ('pdf','document','image','other')),
  asset_label     text,                  -- nome amigável: 'Cartilha Superendividamento CNJ'
  asset_version   text,                  -- versão do arquivo, ex: '2024-v1'
  storage_path    text,                  -- caminho no Storage se aplicável

  -- Contexto técnico
  download_source text        NOT NULL DEFAULT 'portal'
                  CHECK (download_source IN ('portal','admin','api')),
  ip_address      inet,
  user_agent      text,
  referer         text,

  -- Metadados extras (rastreabilidade da jornada)
  cnj_step_ref    smallint,              -- em qual passo da jornada o download ocorreu
  journey_context text,                  -- 'onboarding', 'documentos', 'suporte', etc.
  metadata        jsonb       NOT NULL DEFAULT '{}',

  -- Timestamp imutável (registro forense)
  downloaded_at   timestamptz NOT NULL DEFAULT now(),

  -- Sem updated_at — esta tabela é append-only (log imutável)
  CONSTRAINT no_future_download CHECK (downloaded_at <= now() + interval '5 minutes')
);

-- Sem possibilidade de UPDATE — é um log auditável
CREATE OR REPLACE RULE portal_download_audit_no_update AS
  ON UPDATE TO portal_download_audit DO INSTEAD NOTHING;

-- Sem possibilidade de DELETE — é um log auditável
CREATE OR REPLACE RULE portal_download_audit_no_delete AS
  ON DELETE TO portal_download_audit DO INSTEAD NOTHING;

-- Índices para consultas de auditoria
CREATE INDEX IF NOT EXISTS idx_download_audit_user_id
  ON portal_download_audit(user_id, downloaded_at DESC);

CREATE INDEX IF NOT EXISTS idx_download_audit_caso_id
  ON portal_download_audit(caso_id)
  WHERE caso_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_download_audit_asset_key
  ON portal_download_audit(asset_key, downloaded_at DESC);

CREATE INDEX IF NOT EXISTS idx_download_audit_workspace
  ON portal_download_audit(workspace_id, downloaded_at DESC)
  WHERE workspace_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_download_audit_at
  ON portal_download_audit(downloaded_at DESC);

COMMENT ON TABLE  portal_download_audit IS 'Log imutável de downloads — auditoria de jornada do usuário (Lei 14.181/2021 compliance)';
COMMENT ON COLUMN portal_download_audit.asset_key IS 'Chave do asset: cartilha_superendividamento, anexo_ii_cnj, etc.';
COMMENT ON COLUMN portal_download_audit.downloaded_at IS 'Timestamp imutável — não pode ser alterado após inserção';

-- ─── 2. RPC rpc_log_download() — Log seguro via SECURITY DEFINER ─────────────
-- Permite que o frontend (com authenticated) registre o download
-- sem precisar de INSERT direto na tabela.
-- A RPC valida user_id = auth.uid() antes de inserir.

CREATE OR REPLACE FUNCTION rpc_log_download(
  p_asset_key       text,
  p_asset_type      text      DEFAULT 'pdf',
  p_asset_label     text      DEFAULT NULL,
  p_asset_version   text      DEFAULT NULL,
  p_cnj_step_ref    smallint  DEFAULT NULL,
  p_journey_context text      DEFAULT 'onboarding',
  p_metadata        jsonb     DEFAULT '{}'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid         uuid;
  v_caso_id     uuid;
  v_workspace_id uuid;
  v_new_id      uuid;
BEGIN
  -- Valida autenticação
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'rpc_log_download: usuário não autenticado';
  END IF;

  -- Busca caso vinculado (pode ser NULL)
  SELECT id, workspace_id
    INTO v_caso_id, v_workspace_id
  FROM portal_casos
  WHERE user_id = v_uid
  LIMIT 1;

  INSERT INTO portal_download_audit (
    user_id,
    caso_id,
    workspace_id,
    asset_key,
    asset_type,
    asset_label,
    asset_version,
    download_source,
    cnj_step_ref,
    journey_context,
    metadata
  ) VALUES (
    v_uid,
    v_caso_id,
    v_workspace_id,
    p_asset_key,
    p_asset_type,
    p_asset_label,
    p_asset_version,
    'portal',
    p_cnj_step_ref,
    p_journey_context,
    p_metadata
  )
  RETURNING id INTO v_new_id;

  -- Registra evento na timeline se tiver caso
  IF v_caso_id IS NOT NULL THEN
    INSERT INTO portal_cnj_timeline (
      caso_id,
      workspace_id,
      evento_tipo,
      evento_subtipo,
      descricao,
      payload,
      author_role,
      is_visible_client
    ) VALUES (
      v_caso_id,
      v_workspace_id,
      'documento_baixado',
      p_asset_key,
      format('Cliente baixou: %s', COALESCE(p_asset_label, p_asset_key)),
      jsonb_build_object(
        'asset_key',       p_asset_key,
        'asset_type',      p_asset_type,
        'cnj_step_ref',    p_cnj_step_ref,
        'journey_context', p_journey_context,
        'downloaded_at',   now()
      ),
      'system',
      false  -- não exibe no feed do cliente (apenas admin vê)
    );
  END IF;

  RETURN v_new_id;
END;
$$;

GRANT EXECUTE ON FUNCTION rpc_log_download(text, text, text, text, smallint, text, jsonb)
  TO authenticated;

COMMENT ON FUNCTION rpc_log_download IS
  'Registra download de asset no audit log + timeline do caso. Chamada pelo frontend após download.';

-- ─── 3. View vw_admin_download_audit — Painel admin ─────────────────────────
CREATE OR REPLACE VIEW vw_admin_download_audit
WITH (security_barrier = true)
AS
SELECT
  da.id,
  da.downloaded_at,
  da.asset_key,
  da.asset_type,
  da.asset_label,
  da.asset_version,
  da.cnj_step_ref,
  da.journey_context,
  da.download_source,
  da.ip_address,

  -- Dados do usuário
  da.user_id,
  au.email            AS user_email,
  pc.full_name        AS user_name,
  pc.cpf              AS user_cpf,

  -- Caso
  da.caso_id,
  pc.fase             AS caso_fase,
  pc.cnj_step_atual   AS caso_cnj_step,

  -- Workspace
  da.workspace_id,
  pw.slug             AS workspace_slug,
  pw.name             AS workspace_name,

  -- Metadados extras
  da.metadata

FROM portal_download_audit da
JOIN  auth.users au        ON au.id = da.user_id
LEFT  JOIN portal_casos pc ON pc.id = da.caso_id
LEFT  JOIN portal_workspaces pw ON pw.id = da.workspace_id
ORDER BY da.downloaded_at DESC;

GRANT SELECT ON vw_admin_download_audit TO authenticated;

COMMENT ON VIEW vw_admin_download_audit IS
  'Painel completo de downloads para admin — inclui dados de usuário, caso e workspace';

-- ─── 4. RLS ──────────────────────────────────────────────────────────────────
ALTER TABLE portal_download_audit ENABLE ROW LEVEL SECURITY;

-- Usuário pode ver seus próprios downloads
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='portal_download_audit' AND policyname='own_downloads') THEN
    CREATE POLICY own_downloads ON portal_download_audit
      FOR SELECT TO authenticated
      USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='portal_download_audit' AND policyname='admin_all_downloads') THEN
    CREATE POLICY admin_all_downloads ON portal_download_audit
      FOR ALL TO authenticated USING (is_any_admin());
  END IF;
  -- Ninguém pode fazer INSERT diretamente (apenas via RPC)
  -- Nenhuma política de INSERT aqui → apenas service_role e RPC com SECURITY DEFINER
END $$;

-- ─── 5. Grant de INSERT para service_role apenas ─────────────────────────────
-- authenticated NÃO tem INSERT direto — deve usar rpc_log_download()
REVOKE INSERT, UPDATE, DELETE ON portal_download_audit FROM authenticated;
GRANT  SELECT                  ON portal_download_audit TO authenticated;

-- =============================================================================
-- VERIFICAÇÃO:
-- SELECT asset_key, COUNT(*), MIN(downloaded_at), MAX(downloaded_at)
-- FROM portal_download_audit GROUP BY asset_key ORDER BY 2 DESC;
-- =============================================================================
-- REVERSÃO:
-- DROP VIEW IF EXISTS vw_admin_download_audit;
-- DROP FUNCTION IF EXISTS rpc_log_download(text,text,text,text,smallint,text,jsonb);
-- DROP TABLE IF EXISTS portal_download_audit CASCADE;
-- =============================================================================
