-- ============================================================
-- MIGRATION SAFE 001 — Pontes de compatibilidade
-- Projeto: Portal HMADV — Superendividamento CNJ
-- Estratégia: ADD COLUMN IF NOT EXISTS apenas. Zero DROP. Zero RENAME.
-- Reversível: ver seção -- DOWN no final
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. portal_casos — pontes para o ecossistema existente
-- ────────────────────────────────────────────────────────────
ALTER TABLE portal_casos
  -- Compatibilidade: código Sprint 7 salva rg_emissor, DB tinha rg_orgao_emissor
  ADD COLUMN IF NOT EXISTS rg_emissor              TEXT,

  -- Pontes CRM/suporte
  ADD COLUMN IF NOT EXISTS re_user_id              UUID,          -- → re_users.id
  ADD COLUMN IF NOT EXISTS fd_contact_id           BIGINT,        -- → freshdesk_contacts.fd_contact_id
  ADD COLUMN IF NOT EXISTS fd_ticket_id            BIGINT,        -- → freshdesk_tickets.fd_ticket_id
  ADD COLUMN IF NOT EXISTS fs_contact_id           TEXT,          -- → freshsales_contacts.id
  ADD COLUMN IF NOT EXISTS processo_judicial_id    UUID,          -- → judiciario.processos.id (futuro)

  -- Multi-tenant
  ADD COLUMN IF NOT EXISTS workspace_id            UUID,          -- → portal_workspaces.id

  -- Padrão extensível
  ADD COLUMN IF NOT EXISTS metadata                JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS extra_data              JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS settings                JSONB NOT NULL DEFAULT '{}';

-- Sync bidirecional rg_emissor ↔ rg_orgao_emissor via trigger
CREATE OR REPLACE FUNCTION _sync_rg_emissor()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  -- Quando rg_emissor é preenchido, sincroniza rg_orgao_emissor
  IF NEW.rg_emissor IS NOT NULL AND NEW.rg_emissor <> '' THEN
    NEW.rg_orgao_emissor := NEW.rg_emissor;
  END IF;
  -- Quando rg_orgao_emissor é preenchido, sincroniza rg_emissor
  IF NEW.rg_orgao_emissor IS NOT NULL AND NEW.rg_orgao_emissor <> '' THEN
    NEW.rg_emissor := NEW.rg_orgao_emissor;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_rg_emissor ON portal_casos;
CREATE TRIGGER trg_sync_rg_emissor
  BEFORE INSERT OR UPDATE ON portal_casos
  FOR EACH ROW EXECUTE FUNCTION _sync_rg_emissor();

-- Backfill imediato (sem lock agressivo — usa UPDATE incremental)
UPDATE portal_casos
SET rg_emissor = rg_orgao_emissor
WHERE rg_emissor IS NULL
  AND rg_orgao_emissor IS NOT NULL;

-- Índices não-bloqueantes para as pontes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_portal_casos_re_user_id
  ON portal_casos (re_user_id)
  WHERE re_user_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_portal_casos_fd_contact_id
  ON portal_casos (fd_contact_id)
  WHERE fd_contact_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_portal_casos_workspace_id
  ON portal_casos (workspace_id)
  WHERE workspace_id IS NOT NULL;

COMMENT ON COLUMN portal_casos.rg_emissor           IS 'Alias de rg_orgao_emissor — compatibilidade Sprint 7';
COMMENT ON COLUMN portal_casos.re_user_id            IS 'FK → re_users.id (perfil no sistema RE)';
COMMENT ON COLUMN portal_casos.fd_contact_id         IS 'Bridge → freshdesk_contacts.fd_contact_id';
COMMENT ON COLUMN portal_casos.fd_ticket_id          IS 'Bridge → freshdesk_tickets.fd_ticket_id (ticket principal do caso)';
COMMENT ON COLUMN portal_casos.workspace_id          IS 'FK → portal_workspaces.id (multi-tenant)';
COMMENT ON COLUMN portal_casos.metadata              IS 'Metadados extensíveis livres';
COMMENT ON COLUMN portal_casos.extra_data            IS 'Dados adicionais de integrações externas';
COMMENT ON COLUMN portal_casos.settings              IS 'Configurações específicas do caso';

-- ────────────────────────────────────────────────────────────
-- 2. portal_dividas — ponte para portal_casos + extensão
-- ────────────────────────────────────────────────────────────
ALTER TABLE portal_dividas
  ADD COLUMN IF NOT EXISTS caso_id                 UUID,          -- → portal_casos.id
  ADD COLUMN IF NOT EXISTS cnj_credor_index        SMALLINT,      -- posição no array credores_cnj
  ADD COLUMN IF NOT EXISTS fd_ticket_id            BIGINT,        -- ponte freshdesk
  ADD COLUMN IF NOT EXISTS metadata                JSONB NOT NULL DEFAULT '{}';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_portal_dividas_caso_id
  ON portal_dividas (caso_id)
  WHERE caso_id IS NOT NULL;

-- Backfill: tenta vincular portal_dividas → portal_casos via user_id
UPDATE portal_dividas d
SET caso_id = c.id
FROM portal_casos c
WHERE c.user_id = d.user_id
  AND d.caso_id IS NULL;

COMMENT ON COLUMN portal_dividas.caso_id            IS 'FK → portal_casos.id (vínculo com caso CNJ)';
COMMENT ON COLUMN portal_dividas.cnj_credor_index   IS 'Posição correspondente em portal_casos.credores_cnj[]';

-- ────────────────────────────────────────────────────────────
-- 3. portal_documentos — pontes GED + Freshdesk
-- ────────────────────────────────────────────────────────────
ALTER TABLE portal_documentos
  ADD COLUMN IF NOT EXISTS caso_id                 UUID,          -- → portal_casos.id
  ADD COLUMN IF NOT EXISTS re_document_id          UUID,          -- → re_documents.id (GED)
  ADD COLUMN IF NOT EXISTS fd_ticket_id            BIGINT,        -- ponte freshdesk
  ADD COLUMN IF NOT EXISTS metadata                JSONB NOT NULL DEFAULT '{}';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_portal_documentos_caso_id
  ON portal_documentos (caso_id)
  WHERE caso_id IS NOT NULL;

-- Backfill: vincula documentos a casos via user_id
UPDATE portal_documentos doc
SET caso_id = c.id
FROM portal_casos c
WHERE c.user_id = doc.user_id
  AND doc.caso_id IS NULL;

COMMENT ON COLUMN portal_documentos.caso_id         IS 'FK → portal_casos.id';
COMMENT ON COLUMN portal_documentos.re_document_id  IS 'FK → re_documents.id (GED unificado)';

-- ────────────────────────────────────────────────────────────
-- 4. re_users — pontes portal + extensão
-- ────────────────────────────────────────────────────────────
ALTER TABLE re_users
  ADD COLUMN IF NOT EXISTS portal_caso_id          UUID,          -- → portal_casos.id
  ADD COLUMN IF NOT EXISTS cpf                     TEXT,          -- CPF para correlação
  ADD COLUMN IF NOT EXISTS metadata                JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS settings                JSONB NOT NULL DEFAULT '{}';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_re_users_portal_caso_id
  ON re_users (portal_caso_id)
  WHERE portal_caso_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_re_users_cpf
  ON re_users (cpf)
  WHERE cpf IS NOT NULL;

COMMENT ON COLUMN re_users.portal_caso_id           IS 'FK → portal_casos.id (caso CNJ vinculado)';
COMMENT ON COLUMN re_users.cpf                      IS 'CPF para correlação cross-sistema';

-- ────────────────────────────────────────────────────────────
-- 5. freshdesk_tickets — ponte portal_casos
-- ────────────────────────────────────────────────────────────
ALTER TABLE freshdesk_tickets
  ADD COLUMN IF NOT EXISTS portal_caso_id          UUID,          -- → portal_casos.id
  ADD COLUMN IF NOT EXISTS cnj_form_json           JSONB,         -- snapshot do formulário CNJ
  ADD COLUMN IF NOT EXISTS cnj_fase                TEXT,          -- fase processual
  ADD COLUMN IF NOT EXISTS metadata                JSONB NOT NULL DEFAULT '{}';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_freshdesk_tickets_portal_caso_id
  ON freshdesk_tickets (portal_caso_id)
  WHERE portal_caso_id IS NOT NULL;

COMMENT ON COLUMN freshdesk_tickets.portal_caso_id  IS 'FK → portal_casos.id';
COMMENT ON COLUMN freshdesk_tickets.cnj_form_json   IS 'Snapshot do JSON CNJ no momento da criação do ticket';
COMMENT ON COLUMN freshdesk_tickets.cnj_fase        IS 'Fase processual CNJ: cadastro|analise|conciliacao|judicial|encerrado';

-- ────────────────────────────────────────────────────────────
-- 6. admin_profiles — plataform admin + extensão
-- ────────────────────────────────────────────────────────────
ALTER TABLE admin_profiles
  ADD COLUMN IF NOT EXISTS is_platform_admin       BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS tenant_scope            UUID[],        -- workspaces autorizados (NULL = todos)
  ADD COLUMN IF NOT EXISTS metadata                JSONB NOT NULL DEFAULT '{}';

COMMENT ON COLUMN admin_profiles.is_platform_admin IS 'Super-admin: acesso irrestrito a todos os tenants';
COMMENT ON COLUMN admin_profiles.tenant_scope      IS 'NULL = acesso global; array = restringe a workspaces específicos';

-- ────────────────────────────────────────────────────────────
-- 7. Função auxiliar de compatibilidade: auth.uid() → re_users.id
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_re_user_id(_auth_uid UUID DEFAULT auth.uid())
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT id FROM re_users WHERE auth_id = _auth_uid LIMIT 1;
$$;

COMMENT ON FUNCTION get_re_user_id IS
  'Retorna re_users.id a partir de auth.uid(). SECURITY DEFINER — use apenas em contexto confiável.';

-- ────────────────────────────────────────────────────────────
-- DOWN (reversão manual quando necessário — NÃO executar em prod sem validação)
-- ────────────────────────────────────────────────────────────
-- ALTER TABLE portal_casos DROP COLUMN IF EXISTS rg_emissor, DROP COLUMN IF EXISTS re_user_id, ...;
-- ALTER TABLE portal_dividas DROP COLUMN IF EXISTS caso_id, ...;
-- ALTER TABLE portal_documentos DROP COLUMN IF EXISTS caso_id, ...;
-- ALTER TABLE re_users DROP COLUMN IF EXISTS portal_caso_id, ...;
-- ALTER TABLE freshdesk_tickets DROP COLUMN IF EXISTS portal_caso_id, ...;
-- ALTER TABLE admin_profiles DROP COLUMN IF EXISTS is_platform_admin, ...;
-- DROP FUNCTION IF EXISTS get_re_user_id;
-- DROP FUNCTION IF EXISTS _sync_rg_emissor CASCADE;
