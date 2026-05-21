-- =============================================================================
-- MIGRATION 010 — Tabelas de Jornada de Vídeo do Onboarding CNJ
-- Portal: Hermida Maia Advocacia — Superendividamento CNJ
-- =============================================================================
-- REGRAS ABSOLUTAS: CREATE IF NOT EXISTS, sem DROP, sem RENAME
-- OBJETIVO:
--   1. onboarding_videos   — catálogo de vídeos da jornada CNJ
--   2. onboarding_video_progress — progresso de watch por usuário/vídeo
-- =============================================================================

-- ─── 1. onboarding_videos — Catálogo de vídeos ──────────────────────────────
CREATE TABLE IF NOT EXISTS onboarding_videos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    uuid REFERENCES portal_workspaces(id) ON DELETE SET NULL,

  -- Identificação
  step_key        text        NOT NULL UNIQUE,  -- 'welcome', 'lei_superendividamento', 'negociacao', 'plano_pagamento'
  title           text        NOT NULL,
  description     text,
  thumbnail_url   text,

  -- YouTube
  youtube_id      text        NOT NULL,  -- ex: 'Q0PSv2Lc8Qk'
  duration_sec    integer,               -- duração total em segundos

  -- Regras de obrigatoriedade
  required        boolean     NOT NULL DEFAULT true,
  allow_skip      boolean     NOT NULL DEFAULT false,
  skip_min_pct    smallint    NOT NULL DEFAULT 80,  -- % mínima para pular (0–100)

  -- Sequência e estado
  step_order      smallint    NOT NULL DEFAULT 0,
  cnj_step_ref    smallint,              -- mapeia para cnj_step_atual (1–7)
  is_active       boolean     NOT NULL DEFAULT true,

  -- Metadados
  tags            text[],
  metadata        jsonb       NOT NULL DEFAULT '{}',

  -- Audit
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_videos_workspace
  ON onboarding_videos(workspace_id)
  WHERE workspace_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_onboarding_videos_step_order
  ON onboarding_videos(step_order, is_active);

COMMENT ON TABLE  onboarding_videos IS 'Catálogo de vídeos da jornada educacional CNJ (superendividamento)';
COMMENT ON COLUMN onboarding_videos.step_key      IS 'Chave semântica única do passo: welcome, lei_superendividamento, negociacao, plano_pagamento';
COMMENT ON COLUMN onboarding_videos.youtube_id    IS 'ID do vídeo no YouTube (usado no embed nocookie)';
COMMENT ON COLUMN onboarding_videos.allow_skip    IS 'Se false, assistir 100% é obrigatório antes de avançar';
COMMENT ON COLUMN onboarding_videos.skip_min_pct  IS 'Se allow_skip=true, porcentagem mínima assistida para habilitar botão pular';

-- ─── 2. onboarding_video_progress — Progresso por usuário ───────────────────
CREATE TABLE IF NOT EXISTS onboarding_video_progress (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id        uuid        NOT NULL REFERENCES onboarding_videos(id) ON DELETE CASCADE,
  caso_id         uuid        REFERENCES portal_casos(id) ON DELETE SET NULL,
  workspace_id    uuid        REFERENCES portal_workspaces(id) ON DELETE SET NULL,

  -- Progresso real de visualização
  watch_pct       smallint    NOT NULL DEFAULT 0 CHECK (watch_pct BETWEEN 0 AND 100),
  watch_sec       integer     NOT NULL DEFAULT 0,  -- segundos assistidos (cumulativo)
  max_pct_reached smallint    NOT NULL DEFAULT 0,  -- máxima porcentagem atingida (sem reset)
  session_count   smallint    NOT NULL DEFAULT 0,  -- qtd de sessões de visualização

  -- Estado da jornada
  status          text        NOT NULL DEFAULT 'not_started'
                  CHECK (status IN ('not_started','in_progress','completed','skipped')),
  completed_at    timestamptz,
  skipped_at      timestamptz,

  -- Declaração de pulo (quando allow_skip=true e usuário não assistiu 100%)
  skip_declared   boolean     NOT NULL DEFAULT false,
  skip_reason     text,
  skip_ip         inet,

  -- Último acesso
  last_position_sec integer   NOT NULL DEFAULT 0,  -- posição em segundos para retomar
  last_watched_at   timestamptz,

  -- Audit
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  UNIQUE (user_id, video_id)
);

CREATE INDEX IF NOT EXISTS idx_ovp_user_id
  ON onboarding_video_progress(user_id);

CREATE INDEX IF NOT EXISTS idx_ovp_video_id
  ON onboarding_video_progress(video_id);

CREATE INDEX IF NOT EXISTS idx_ovp_caso_id
  ON onboarding_video_progress(caso_id)
  WHERE caso_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ovp_status
  ON onboarding_video_progress(status, user_id);

COMMENT ON TABLE  onboarding_video_progress IS 'Progresso de visualização de vídeos por usuário — base para Journey Engine e auto-advance';
COMMENT ON COLUMN onboarding_video_progress.watch_pct       IS 'Porcentagem atual assistida (0–100)';
COMMENT ON COLUMN onboarding_video_progress.max_pct_reached IS 'Porcentagem máxima já atingida (não regride)';
COMMENT ON COLUMN onboarding_video_progress.last_position_sec IS 'Posição em segundos para retomar de onde parou';
COMMENT ON COLUMN onboarding_video_progress.skip_declared   IS 'true = usuário declarou ter lido/assistido fora do portal';

-- ─── 3. Trigger: updated_at automático ──────────────────────────────────────
CREATE OR REPLACE FUNCTION _set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_onboarding_videos_updated_at ON onboarding_videos;
CREATE TRIGGER trg_onboarding_videos_updated_at
  BEFORE UPDATE ON onboarding_videos
  FOR EACH ROW EXECUTE FUNCTION _set_updated_at();

DROP TRIGGER IF EXISTS trg_ovp_updated_at ON onboarding_video_progress;
CREATE TRIGGER trg_ovp_updated_at
  BEFORE UPDATE ON onboarding_video_progress
  FOR EACH ROW EXECUTE FUNCTION _set_updated_at();

-- ─── 4. RLS ─────────────────────────────────────────────────────────────────
ALTER TABLE onboarding_videos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_video_progress ENABLE ROW LEVEL SECURITY;

-- onboarding_videos: todos autenticados podem ler; apenas admin gerencia
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='onboarding_videos' AND policyname='auth_read_videos') THEN
    CREATE POLICY auth_read_videos ON onboarding_videos
      FOR SELECT TO authenticated USING (is_active = true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='onboarding_videos' AND policyname='admin_manage_videos') THEN
    CREATE POLICY admin_manage_videos ON onboarding_videos
      FOR ALL TO authenticated USING (is_any_admin());
  END IF;
END $$;

-- onboarding_video_progress: usuário vê/grava o próprio progresso; admin vê tudo
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='onboarding_video_progress' AND policyname='own_video_progress') THEN
    CREATE POLICY own_video_progress ON onboarding_video_progress
      FOR ALL TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='onboarding_video_progress' AND policyname='admin_video_progress') THEN
    CREATE POLICY admin_video_progress ON onboarding_video_progress
      FOR ALL TO authenticated USING (is_any_admin());
  END IF;
END $$;

-- ─── 5. Seed: 4 vídeos oficiais da jornada CNJ ──────────────────────────────
INSERT INTO onboarding_videos
  (step_key, title, description, youtube_id, duration_sec, required, allow_skip, skip_min_pct, step_order, cnj_step_ref, tags)
VALUES
  (
    'welcome',
    'Bem-vindo ao Portal CNJ de Superendividamento',
    'Conheça o processo e saiba como o escritório Hermida Maia Advocacia vai te auxiliar em cada etapa.',
    'Q0PSv2Lc8Qk',
    NULL,
    true, false, 100,
    1, 1,
    ARRAY['boas_vindas','introducao','cnj']
  ),
  (
    'lei_superendividamento',
    'Lei do Superendividamento — Seus Direitos',
    'Entenda a Lei 14.181/2021 e como ela protege consumidores com dívidas além da capacidade de pagamento.',
    'd7dW08nWAcY',
    NULL,
    true, true, 80,
    2, 2,
    ARRAY['lei_14181','direitos','educacao_financeira']
  ),
  (
    'negociacao',
    'Como Funciona a Negociação de Dívidas',
    'Aprenda o processo de conciliação com credores e o papel do escritório na mediação.',
    'xUbtNefpFs8',
    NULL,
    true, true, 80,
    3, 3,
    ARRAY['negociacao','conciliacao','credores']
  ),
  (
    'plano_pagamento',
    'Plano de Pagamento e Formulário CNJ',
    'Entenda como montar seu plano de pagamento e como preencher o formulário oficial CNJ Anexo II.',
    'GEtGj05jxTw',
    NULL,
    true, true, 80,
    4, 4,
    ARRAY['plano_pagamento','formulario_cnj','anexo_ii']
  )
ON CONFLICT (step_key) DO UPDATE
  SET
    title        = EXCLUDED.title,
    description  = EXCLUDED.description,
    youtube_id   = EXCLUDED.youtube_id,
    allow_skip   = EXCLUDED.allow_skip,
    skip_min_pct = EXCLUDED.skip_min_pct,
    step_order   = EXCLUDED.step_order,
    cnj_step_ref = EXCLUDED.cnj_step_ref,
    tags         = EXCLUDED.tags,
    updated_at   = now();

-- ─── 6. Grants ───────────────────────────────────────────────────────────────
GRANT SELECT                    ON onboarding_videos          TO authenticated;
GRANT SELECT, INSERT, UPDATE    ON onboarding_video_progress  TO authenticated;

-- =============================================================================
-- REVERSÃO:
-- DROP TABLE IF EXISTS onboarding_video_progress;
-- DROP TABLE IF EXISTS onboarding_videos;
-- DROP FUNCTION IF EXISTS _set_updated_at() CASCADE;
-- =============================================================================
