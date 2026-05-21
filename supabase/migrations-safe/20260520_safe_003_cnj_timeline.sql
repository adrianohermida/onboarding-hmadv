-- ============================================================
-- MIGRATION SAFE 003 — CNJ Timeline + Notificações
-- Tabelas novas para rastrear eventos do caso e orquestrar
-- notificações multi-canal (portal, Freshdesk, Resend/e-mail).
-- Zero modificação em tabelas existentes.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. portal_cnj_timeline — log imutável de eventos do caso
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS portal_cnj_timeline (
  id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  caso_id         UUID    NOT NULL REFERENCES portal_casos(id) ON DELETE CASCADE,
  workspace_id    UUID    REFERENCES portal_workspaces(id) ON DELETE SET NULL,

  -- Tipagem do evento (vocabulário controlado)
  evento_tipo     TEXT    NOT NULL,
  -- Valores: formulario_iniciado | step_concluido | formulario_enviado |
  --          documento_enviado | documento_aprovado | documento_rejeitado |
  --          fase_alterada | ticket_criado | ticket_atualizado |
  --          notificacao_enviada | comentario_admin | conciliacao_agendada |
  --          acordo_formalizado | processo_distribuido | encerrado

  evento_subtipo  TEXT,                              -- ex: step_concluido:3 / fase_alterada:analise
  descricao       TEXT    NOT NULL,                  -- texto legível para exibição na UI
  payload         JSONB   NOT NULL DEFAULT '{}',     -- dados estruturados do evento

  -- Autoria
  author_uid      UUID    REFERENCES auth.users(id) ON DELETE SET NULL,  -- quem disparou
  author_role     TEXT,                              -- 'cliente' | 'advogado' | 'sistema' | 'ia'
  author_name     TEXT,                              -- cache do nome (evita join em leitura)

  -- Referências cruzadas (opcional — enriquece sem obrigar FK)
  fd_ticket_id    BIGINT,
  re_task_id      UUID,
  documento_id    UUID,
  step_cnj        SMALLINT,                          -- 1–7 se evento relacionado a step específico

  -- Controle
  is_visible_client BOOLEAN NOT NULL DEFAULT true,   -- exibe para o cliente no portal?
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Timeline é append-only: sem updated_at
  CONSTRAINT chk_evento_tipo CHECK (evento_tipo IN (
    'formulario_iniciado', 'step_concluido', 'formulario_enviado',
    'documento_enviado', 'documento_aprovado', 'documento_rejeitado',
    'fase_alterada', 'ticket_criado', 'ticket_atualizado',
    'notificacao_enviada', 'comentario_admin', 'conciliacao_agendada',
    'acordo_formalizado', 'processo_distribuido', 'encerrado',
    'sistema'  -- catchall para automações
  ))
);

CREATE INDEX IF NOT EXISTS idx_cnj_timeline_caso_id
  ON portal_cnj_timeline (caso_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cnj_timeline_workspace_id
  ON portal_cnj_timeline (workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cnj_timeline_evento_tipo
  ON portal_cnj_timeline (evento_tipo);
CREATE INDEX IF NOT EXISTS idx_cnj_timeline_author_uid
  ON portal_cnj_timeline (author_uid)
  WHERE author_uid IS NOT NULL;

COMMENT ON TABLE portal_cnj_timeline IS
  'Log imutável append-only de todos os eventos do caso CNJ. '
  'Alimenta: timeline do cliente, auditoria, Freshdesk, relatórios.';
COMMENT ON COLUMN portal_cnj_timeline.is_visible_client IS
  'false = evento interno (admin/sistema apenas); true = exibido na timeline do cliente';

-- ────────────────────────────────────────────────────────────
-- 2. portal_cnj_notifications — fila de notificações pendentes
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS portal_cnj_notifications (
  id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  caso_id         UUID    NOT NULL REFERENCES portal_casos(id) ON DELETE CASCADE,
  workspace_id    UUID    REFERENCES portal_workspaces(id) ON DELETE SET NULL,
  timeline_id     UUID    REFERENCES portal_cnj_timeline(id) ON DELETE SET NULL,

  -- Destino e canal
  recipient_uid   UUID    REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient_email TEXT    NOT NULL,
  canal           TEXT    NOT NULL DEFAULT 'email',
  -- Canais: email | freshdesk | portal | whatsapp | sms

  -- Conteúdo
  assunto         TEXT    NOT NULL,
  corpo_html      TEXT,
  corpo_texto     TEXT,
  template_key    TEXT,                              -- ex: 'cnj.formulario_enviado'
  template_vars   JSONB   NOT NULL DEFAULT '{}',

  -- Controle de envio
  status          TEXT    NOT NULL DEFAULT 'pendente',
  -- pendente | enviado | falhou | ignorado | cancelado
  tentativas      SMALLINT NOT NULL DEFAULT 0,
  max_tentativas  SMALLINT NOT NULL DEFAULT 3,
  ultimo_erro     TEXT,
  agendado_para   TIMESTAMPTZ,                       -- null = envio imediato
  enviado_em      TIMESTAMPTZ,

  -- Rastreamento externo
  resend_id       TEXT,                              -- ID da mensagem no Resend
  fd_note_id      TEXT,                              -- ID da nota no Freshdesk

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_canal CHECK (canal IN ('email','freshdesk','portal','whatsapp','sms')),
  CONSTRAINT chk_status CHECK (status IN ('pendente','enviado','falhou','ignorado','cancelado'))
);

CREATE INDEX IF NOT EXISTS idx_cnj_notif_caso_id
  ON portal_cnj_notifications (caso_id);
CREATE INDEX IF NOT EXISTS idx_cnj_notif_status_agendado
  ON portal_cnj_notifications (status, agendado_para)
  WHERE status = 'pendente';
CREATE INDEX IF NOT EXISTS idx_cnj_notif_recipient_email
  ON portal_cnj_notifications (recipient_email);

DROP TRIGGER IF EXISTS trg_cnj_notif_updated_at ON portal_cnj_notifications;
CREATE TRIGGER trg_cnj_notif_updated_at
  BEFORE UPDATE ON portal_cnj_notifications
  FOR EACH ROW EXECUTE FUNCTION _set_updated_at();

COMMENT ON TABLE portal_cnj_notifications IS
  'Fila de notificações multi-canal. Processada pela Edge Function portal-notify.';

-- ────────────────────────────────────────────────────────────
-- 3. Trigger automático: grava timeline ao mudar fase do caso
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION _auto_timeline_fase()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.fase IS DISTINCT FROM NEW.fase THEN
    INSERT INTO portal_cnj_timeline (
      caso_id, workspace_id, evento_tipo, evento_subtipo,
      descricao, payload, author_role
    ) VALUES (
      NEW.id,
      NEW.workspace_id,
      'fase_alterada',
      'fase_alterada:' || NEW.fase,
      'Fase do caso alterada de "' || COALESCE(OLD.fase,'—') || '" para "' || NEW.fase || '"',
      jsonb_build_object(
        'fase_anterior', OLD.fase,
        'fase_nova',     NEW.fase,
        'caso_id',       NEW.id
      ),
      'sistema'
    );
  END IF;

  IF (OLD.cnj_step_atual IS DISTINCT FROM NEW.cnj_step_atual)
     AND NEW.cnj_step_atual > COALESCE(OLD.cnj_step_atual, 0) THEN
    INSERT INTO portal_cnj_timeline (
      caso_id, workspace_id, evento_tipo, evento_subtipo,
      descricao, payload, author_role, step_cnj, is_visible_client
    ) VALUES (
      NEW.id,
      NEW.workspace_id,
      'step_concluido',
      'step_concluido:' || NEW.cnj_step_atual,
      'Passo ' || NEW.cnj_step_atual || ' do formulário CNJ concluído',
      jsonb_build_object('step', NEW.cnj_step_atual),
      'sistema',
      NEW.cnj_step_atual,
      true
    );
  END IF;

  IF (OLD.onboarding_done IS DISTINCT FROM NEW.onboarding_done)
     AND NEW.onboarding_done = true THEN
    INSERT INTO portal_cnj_timeline (
      caso_id, workspace_id, evento_tipo, evento_subtipo,
      descricao, payload, author_role, is_visible_client
    ) VALUES (
      NEW.id,
      NEW.workspace_id,
      'formulario_enviado',
      NULL,
      'Formulário CNJ de superendividamento enviado ao escritório',
      jsonb_build_object(
        'n_credores',   jsonb_array_length(COALESCE(NEW.credores_cnj, '[]'::jsonb)),
        'cnj_step',     NEW.cnj_step_atual
      ),
      'sistema',
      true
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_timeline_portal_casos ON portal_casos;
CREATE TRIGGER trg_auto_timeline_portal_casos
  AFTER UPDATE ON portal_casos
  FOR EACH ROW EXECUTE FUNCTION _auto_timeline_fase();

-- ────────────────────────────────────────────────────────────
-- 4. Trigger automático: grava timeline ao aprovar/rejeitar doc
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION _auto_timeline_doc()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_caso_id UUID;
BEGIN
  -- Resolve caso_id (pode vir direto ou via user_id)
  v_caso_id := COALESCE(
    NEW.caso_id,
    (SELECT id FROM portal_casos WHERE user_id = NEW.user_id LIMIT 1)
  );

  IF v_caso_id IS NULL THEN RETURN NEW; END IF;

  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO portal_cnj_timeline (
      caso_id, evento_tipo, descricao, payload,
      author_uid, author_role, documento_id, is_visible_client
    ) VALUES (
      v_caso_id,
      CASE NEW.status
        WHEN 'aprovado'    THEN 'documento_aprovado'
        WHEN 'rejeitado'   THEN 'documento_rejeitado'
        WHEN 'em_analise'  THEN 'documento_enviado'
        ELSE 'sistema'
      END,
      'Documento "' || NEW.tipo || '" — status: ' || NEW.status,
      jsonb_build_object(
        'tipo',        NEW.tipo,
        'status_novo', NEW.status,
        'status_ant',  OLD.status,
        'obs_admin',   NEW.observacao_admin
      ),
      NEW.aprovado_por_uid,
      CASE WHEN NEW.aprovado_por_uid IS NOT NULL THEN 'advogado' ELSE 'sistema' END,
      NEW.id,
      true
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_timeline_portal_documentos ON portal_documentos;
CREATE TRIGGER trg_auto_timeline_portal_documentos
  AFTER UPDATE ON portal_documentos
  FOR EACH ROW EXECUTE FUNCTION _auto_timeline_doc();

-- ────────────────────────────────────────────────────────────
-- 5. RLS para as novas tabelas
-- ────────────────────────────────────────────────────────────
ALTER TABLE portal_cnj_timeline      ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_cnj_notifications ENABLE ROW LEVEL SECURITY;

-- Timeline: owner lê eventos visíveis; admins lêem tudo
DROP POLICY IF EXISTS "timeline_owner_visible"   ON portal_cnj_timeline;
CREATE POLICY "timeline_owner_visible"
  ON portal_cnj_timeline FOR SELECT
  USING (
    is_visible_client = true
    AND caso_id IN (SELECT id FROM portal_casos WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "timeline_admin_all"       ON portal_cnj_timeline;
CREATE POLICY "timeline_admin_all"
  ON portal_cnj_timeline FOR ALL
  USING (is_any_admin());

DROP POLICY IF EXISTS "timeline_ws_advogado"     ON portal_cnj_timeline;
CREATE POLICY "timeline_ws_advogado"
  ON portal_cnj_timeline FOR SELECT
  USING (
    workspace_id = ANY(my_workspace_ids())
    AND EXISTS (
      SELECT 1 FROM portal_workspace_members
      WHERE workspace_id = portal_cnj_timeline.workspace_id
        AND user_id = auth.uid()
        AND role IN ('owner','admin','advogado','estagiario')
        AND is_active = true
    )
  );

-- Notifications: somente admins e sistema manipulam
DROP POLICY IF EXISTS "notif_admin_all"          ON portal_cnj_notifications;
CREATE POLICY "notif_admin_all"
  ON portal_cnj_notifications FOR ALL
  USING (is_any_admin());

DROP POLICY IF EXISTS "notif_owner_select"       ON portal_cnj_notifications;
CREATE POLICY "notif_owner_select"
  ON portal_cnj_notifications FOR SELECT
  USING (
    canal = 'portal'
    AND caso_id IN (SELECT id FROM portal_casos WHERE user_id = auth.uid())
  );

-- ────────────────────────────────────────────────────────────
-- DOWN
-- ────────────────────────────────────────────────────────────
-- DROP TABLE IF EXISTS portal_cnj_notifications;
-- DROP TABLE IF EXISTS portal_cnj_timeline;
-- DROP FUNCTION IF EXISTS _auto_timeline_fase CASCADE;
-- DROP FUNCTION IF EXISTS _auto_timeline_doc CASCADE;
