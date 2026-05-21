-- ============================================================
-- MIGRATION SAFE 010 — Suporte Freshdesk no portal do cliente
-- Projeto: Portal HMADV
-- Estratégia: ADD COLUMN IF NOT EXISTS, policies idempotentes. Zero DROP. Zero RENAME.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. freshdesk_tickets — espelho consultável pelo cliente
-- ────────────────────────────────────────────────────────────
ALTER TABLE freshdesk_tickets
  ADD COLUMN IF NOT EXISTS fd_contact_id    BIGINT,
  ADD COLUMN IF NOT EXISTS support_email    TEXT,
  ADD COLUMN IF NOT EXISTS fd_raw_payload   JSONB,
  ADD COLUMN IF NOT EXISTS last_synced_at   TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_freshdesk_tickets_requester_email
  ON freshdesk_tickets (requester_email)
  WHERE requester_email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_freshdesk_tickets_fd_contact_id
  ON freshdesk_tickets (fd_contact_id)
  WHERE fd_contact_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_freshdesk_tickets_status_updated
  ON freshdesk_tickets (status, updated_at DESC);

COMMENT ON COLUMN freshdesk_tickets.requester_email IS 'E-mail do usuário remetente/autenticado no portal';
COMMENT ON COLUMN freshdesk_tickets.support_email   IS 'Caixa de suporte interna destinatária/operacional';
COMMENT ON COLUMN freshdesk_tickets.fd_raw_payload  IS 'Payload bruto retornado pela API do Freshdesk';

-- Leitura pelo cliente autenticado: por requester_email ou pelo caso vinculado ao usuário.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename='freshdesk_tickets' AND policyname='client_read_own_freshdesk_tickets'
  ) THEN
    CREATE POLICY client_read_own_freshdesk_tickets
      ON freshdesk_tickets FOR SELECT TO authenticated
      USING (
        requester_email = (auth.jwt() ->> 'email')
        OR EXISTS (
          SELECT 1
          FROM portal_casos pc
          WHERE pc.id = freshdesk_tickets.portal_caso_id
            AND pc.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────
-- 2. freshdesk_contacts — contato consultável pelo próprio cliente
-- ────────────────────────────────────────────────────────────
ALTER TABLE freshdesk_contacts
  ADD COLUMN IF NOT EXISTS cpf               TEXT,
  ADD COLUMN IF NOT EXISTS status            TEXT,
  ADD COLUMN IF NOT EXISTS lifecycle_stage   TEXT,
  ADD COLUMN IF NOT EXISTS tickets_count     INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fd_raw_payload    JSONB,
  ADD COLUMN IF NOT EXISTS last_synced_at    TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_freshdesk_contacts_email
  ON freshdesk_contacts (email)
  WHERE email IS NOT NULL;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename='freshdesk_contacts' AND policyname='client_read_own_freshdesk_contact'
  ) THEN
    CREATE POLICY client_read_own_freshdesk_contact
      ON freshdesk_contacts FOR SELECT TO authenticated
      USING (email = (auth.jwt() ->> 'email'));
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────
-- 3. portal_casos — mantém ponte com ticket/contact principal
-- ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_portal_casos_fd_ticket_id
  ON portal_casos (fd_ticket_id)
  WHERE fd_ticket_id IS NOT NULL;
