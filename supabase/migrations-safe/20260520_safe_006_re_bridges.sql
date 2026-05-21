-- =============================================================================
-- MIGRATION 006 — Pontes portal_casos ↔ re_* (forms, responses, documents)
-- Portal: Hermida Maia Advocacia — Superendividamento CNJ
-- =============================================================================
-- REGRAS ABSOLUTAS: ADD COLUMN IF NOT EXISTS, nullable, sem FK enforcement
-- OBJETIVO: Ligar portal_casos ao motor re_forms/re_journeys/re_documents,
--   sem recriar nenhuma dessas engines. Reutilização pura.
-- =============================================================================
--
-- MAPA DE REUTILIZAÇÃO:
--
--   portal_casos ──cnj_form_id────────► re_forms        (template do form CNJ)
--   portal_casos ──cnj_response_id────► re_form_responses (resposta ativa do usuário)
--   re_form_responses ──portal_caso_id► portal_casos    (ponteiro reverso)
--   re_forms     ──workspace_id───────► portal_workspaces (multi-tenant)
--   re_journeys  ──workspace_id───────► portal_workspaces (multi-tenant)
--
-- =============================================================================

-- ─── 1. portal_casos ↔ re_forms (template do formulário CNJ) ─────────────────
ALTER TABLE portal_casos
  ADD COLUMN IF NOT EXISTS cnj_form_id uuid;

COMMENT ON COLUMN portal_casos.cnj_form_id
  IS 'FK → re_forms.id — template do formulário CNJ (7 passos) usado neste caso';

-- ─── 2. portal_casos ↔ re_form_responses (resposta ativa) ───────────────────
ALTER TABLE portal_casos
  ADD COLUMN IF NOT EXISTS cnj_response_id uuid;

COMMENT ON COLUMN portal_casos.cnj_response_id
  IS 'FK → re_form_responses.id — resposta CNJ em progresso ou finalizada';

-- ─── 3. re_form_responses ↔ portal_casos (ponteiro reverso) ──────────────────
ALTER TABLE re_form_responses
  ADD COLUMN IF NOT EXISTS portal_caso_id uuid;

COMMENT ON COLUMN re_form_responses.portal_caso_id
  IS 'FK → portal_casos.id — caso superendividamento desta resposta CNJ';

-- ─── 4. re_form_responses ↔ portal_workspaces (multi-tenant) ─────────────────
ALTER TABLE re_form_responses
  ADD COLUMN IF NOT EXISTS workspace_id uuid;

COMMENT ON COLUMN re_form_responses.workspace_id
  IS 'Multi-tenant: workspace ao qual esta resposta pertence';

-- ─── 5. re_forms ↔ portal_workspaces (multi-tenant) ─────────────────────────
ALTER TABLE re_forms
  ADD COLUMN IF NOT EXISTS workspace_id uuid;

COMMENT ON COLUMN re_forms.workspace_id
  IS 'Multi-tenant: workspace ao qual este formulário pertence (null = global)';

-- ─── 6. re_journeys ↔ portal_workspaces (multi-tenant) ──────────────────────
ALTER TABLE re_journeys
  ADD COLUMN IF NOT EXISTS workspace_id uuid;

COMMENT ON COLUMN re_journeys.workspace_id
  IS 'Multi-tenant: workspace ao qual esta jornada pertence (null = global)';

-- ─── 7. re_tasks ↔ portal_casos (link direto) ────────────────────────────────
-- re_tasks já existe como engine de tarefas; vincular ao caso permite
-- listar tarefas do escritório associadas a um caso específico
ALTER TABLE re_tasks
  ADD COLUMN IF NOT EXISTS portal_caso_id uuid;

COMMENT ON COLUMN re_tasks.portal_caso_id
  IS 'FK → portal_casos.id — tarefa vinculada a um caso de superendividamento';

-- ─── 8. Índices para JOINs e RLS performance ────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_portal_casos_cnj_form_id
  ON portal_casos(cnj_form_id)
  WHERE cnj_form_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_portal_casos_cnj_response_id
  ON portal_casos(cnj_response_id)
  WHERE cnj_response_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_re_form_responses_portal_caso
  ON re_form_responses(portal_caso_id)
  WHERE portal_caso_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_re_form_responses_workspace
  ON re_form_responses(workspace_id)
  WHERE workspace_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_re_forms_workspace
  ON re_forms(workspace_id)
  WHERE workspace_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_re_journeys_workspace
  ON re_journeys(workspace_id)
  WHERE workspace_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_re_tasks_portal_caso
  ON re_tasks(portal_caso_id)
  WHERE portal_caso_id IS NOT NULL;

-- ─── 9. View bridge: portal_casos ↔ re_form_responses unificado ─────────────
-- Evita JOIN complexo no frontend. Leitura admin com security_barrier.
CREATE OR REPLACE VIEW vw_portal_cnj_form_status
WITH (security_barrier = true)
AS
SELECT
  pc.id              AS caso_id,
  pc.user_id         AS auth_uid,
  pc.workspace_id,
  pc.full_name,
  pc.cpf,
  pc.fase,
  pc.cnj_step_atual,
  pc.onboarding_done,
  pc.cnj_form_id,
  pc.cnj_response_id,
  -- re_forms info
  rf.title           AS form_title,
  rf.version         AS form_version,
  rf.system_key      AS form_system_key,
  -- re_form_responses info
  rfr.status         AS response_status,
  rfr.started_at     AS response_started_at,
  rfr.completed_at   AS response_completed_at,
  rfr.score_pct      AS response_score_pct,
  rfr.calculation_results AS response_calculations,
  rfr.metadata       AS response_metadata
FROM portal_casos pc
LEFT JOIN re_forms rf        ON rf.id = pc.cnj_form_id
LEFT JOIN re_form_responses rfr ON rfr.id = pc.cnj_response_id;

GRANT SELECT ON vw_portal_cnj_form_status TO authenticated;

COMMENT ON VIEW vw_portal_cnj_form_status
  IS 'Bridge view: portal_casos ↔ re_forms ↔ re_form_responses — sem JOINs no cliente';

-- =============================================================================
-- REVERSÃO:
-- ALTER TABLE portal_casos        DROP COLUMN IF EXISTS cnj_form_id;
-- ALTER TABLE portal_casos        DROP COLUMN IF EXISTS cnj_response_id;
-- ALTER TABLE re_form_responses   DROP COLUMN IF EXISTS portal_caso_id;
-- ALTER TABLE re_form_responses   DROP COLUMN IF EXISTS workspace_id;
-- ALTER TABLE re_forms            DROP COLUMN IF EXISTS workspace_id;
-- ALTER TABLE re_journeys         DROP COLUMN IF EXISTS workspace_id;
-- ALTER TABLE re_tasks            DROP COLUMN IF EXISTS portal_caso_id;
-- DROP VIEW IF EXISTS vw_portal_cnj_form_status;
-- =============================================================================
