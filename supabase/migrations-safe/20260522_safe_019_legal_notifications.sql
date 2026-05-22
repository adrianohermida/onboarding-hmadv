-- =============================================================================
-- MIGRATION SAFE 019 — Evolução de portal_cnj_notifications para central legal
-- =============================================================================
-- Auditoria:
-- - Reaproveita portal_cnj_notifications como tabela principal de interações.
-- - Reaproveita portal_cnj_timeline como cadeia de eventos/auditoria.
-- - Reaproveita portal_documentos/Autentique para assinaturas.
-- - Evita criar um domínio paralelo legal_notifications neste recorte.
-- =============================================================================

ALTER TABLE portal_cnj_notifications
  ADD COLUMN IF NOT EXISTS interaction_type     text NOT NULL DEFAULT 'notificacao',
  ADD COLUMN IF NOT EXISTS interaction_status   text NOT NULL DEFAULT 'nao_lido',
  ADD COLUMN IF NOT EXISTS requires_ack         boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS requires_comment     boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS requires_signature   boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS document_id          uuid REFERENCES portal_documentos(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS autentique_id        text,
  ADD COLUMN IF NOT EXISTS read_at              timestamptz,
  ADD COLUMN IF NOT EXISTS opened_at            timestamptz,
  ADD COLUMN IF NOT EXISTS delivered_at         timestamptz,
  ADD COLUMN IF NOT EXISTS acknowledged_at      timestamptz,
  ADD COLUMN IF NOT EXISTS ack_comment          text,
  ADD COLUMN IF NOT EXISTS content_hash         text,
  ADD COLUMN IF NOT EXISTS evidence_hash        text,
  ADD COLUMN IF NOT EXISTS legal_metadata       jsonb NOT NULL DEFAULT '{}';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'portal_cnj_notifications_interaction_type_chk'
  ) THEN
    ALTER TABLE portal_cnj_notifications
      ADD CONSTRAINT portal_cnj_notifications_interaction_type_chk
      CHECK (interaction_type IN ('intimacao','solicitacao','orcamento','notificacao','assinatura'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'portal_cnj_notifications_interaction_status_chk'
  ) THEN
    ALTER TABLE portal_cnj_notifications
      ADD CONSTRAINT portal_cnj_notifications_interaction_status_chk
      CHECK (interaction_status IN ('nao_lido','lido','assinado','pendente_assinatura','aprovado','pendente','recusado'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_cnj_notif_interaction_type_status
  ON portal_cnj_notifications (interaction_type, interaction_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cnj_notif_recipient_status
  ON portal_cnj_notifications (recipient_uid, interaction_status, created_at DESC)
  WHERE recipient_uid IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cnj_notif_document_id
  ON portal_cnj_notifications (document_id)
  WHERE document_id IS NOT NULL;

ALTER TABLE portal_cnj_timeline DROP CONSTRAINT IF EXISTS chk_evento_tipo;
ALTER TABLE portal_cnj_timeline
  ADD CONSTRAINT chk_evento_tipo CHECK (evento_tipo IN (
    'formulario_iniciado', 'step_concluido', 'formulario_enviado',
    'documento_enviado', 'documento_aprovado', 'documento_rejeitado',
    'fase_alterada', 'ticket_criado', 'ticket_atualizado',
    'notificacao_enviada', 'comentario_admin', 'conciliacao_agendada',
    'acordo_formalizado', 'processo_distribuido', 'encerrado',
    'notification.read', 'notification.acknowledged', 'notification.commented',
    'notification.delivered', 'notification.failed',
    'sistema'
  ));

DROP POLICY IF EXISTS notif_owner_select ON portal_cnj_notifications;
DROP POLICY IF EXISTS notifications_client_select ON portal_cnj_notifications;

CREATE POLICY notifications_client_select
  ON portal_cnj_notifications FOR SELECT TO authenticated
  USING (
    canal = 'portal'
    AND (
      recipient_uid = auth.uid()
      OR recipient_email = (auth.jwt() ->> 'email')
      OR caso_id IN (SELECT id FROM portal_casos WHERE user_id = auth.uid())
    )
  );

CREATE OR REPLACE FUNCTION mark_portal_notification_read(p_notification_id uuid)
RETURNS portal_cnj_notifications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notification portal_cnj_notifications%ROWTYPE;
BEGIN
  SELECT *
    INTO v_notification
    FROM portal_cnj_notifications
   WHERE id = p_notification_id
     AND canal = 'portal'
     AND (
       recipient_uid = auth.uid()
       OR recipient_email = (auth.jwt() ->> 'email')
       OR caso_id IN (SELECT id FROM portal_casos WHERE user_id = auth.uid())
     );

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Notificação não encontrada ou sem permissão';
  END IF;

  UPDATE portal_cnj_notifications
     SET read_at = COALESCE(read_at, now()),
         opened_at = COALESCE(opened_at, now()),
         interaction_status = CASE
           WHEN interaction_status = 'nao_lido' THEN 'lido'
           ELSE interaction_status
         END,
         updated_at = now()
   WHERE id = p_notification_id
   RETURNING * INTO v_notification;

  INSERT INTO portal_cnj_timeline (
    caso_id,
    workspace_id,
    evento_tipo,
    evento_subtipo,
    descricao,
    payload,
    author_uid,
    author_role,
    is_visible_client
  ) VALUES (
    v_notification.caso_id,
    v_notification.workspace_id,
    v_notification.timeline_id,
    'notification.read',
    v_notification.interaction_type,
    'Notificação aberta/lida no portal.',
    jsonb_build_object(
      'notification_id', v_notification.id,
      'interaction_type', v_notification.interaction_type,
      'interaction_status', v_notification.interaction_status,
      'content_hash', v_notification.content_hash
    ),
    auth.uid(),
    'client',
    true
  );

  RETURN v_notification;
END;
$$;

GRANT EXECUTE ON FUNCTION mark_portal_notification_read(uuid) TO authenticated;

COMMENT ON COLUMN portal_cnj_notifications.interaction_type
  IS 'Tipo de interação do drawer: intimacao|solicitacao|orcamento|notificacao|assinatura.';
COMMENT ON COLUMN portal_cnj_notifications.interaction_status
  IS 'Estado jurídico visual: nao_lido|lido|assinado|pendente_assinatura|aprovado|pendente|recusado.';
COMMENT ON COLUMN portal_cnj_notifications.content_hash
  IS 'Hash do conteúdo enviado para cadeia de custódia.';
COMMENT ON FUNCTION mark_portal_notification_read(uuid)
  IS 'Marca uma notificação portal como lida com validação de destinatário e evento em portal_cnj_timeline.';
