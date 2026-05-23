-- =============================================================================
-- MIGRATION SAFE 023 — CRM conversacional juridico multi-tenant
-- =============================================================================
-- Objetivo:
-- - Criar entidade real de conversa, mensagens, participantes, tickets e jornadas.
-- - Tirar o dominio conversacional do agrupamento em frontend.
-- - Preparar realtime, fulltext, attachments, read receipts, typing e omnichannel.
-- - Manter compatibilidade com portal_casos, freshdesk_tickets e timeline juridica.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION current_workspace_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT pwm.workspace_id
      FROM portal_workspace_members pwm
      WHERE pwm.user_id = auth.uid()
      ORDER BY pwm.id ASC
      LIMIT 1
    ),
    (
      SELECT pw.id
      FROM portal_workspaces pw
      WHERE pw.owner_id = auth.uid()
      ORDER BY pw.created_at ASC NULLS LAST
      LIMIT 1
    )
  );
$$;

CREATE OR REPLACE FUNCTION set_crm_tenant_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.tenant_id IS NULL THEN
    NEW.tenant_id := current_workspace_id();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS crm_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES portal_workspaces(id) ON DELETE CASCADE,
  case_id uuid REFERENCES portal_casos(id) ON DELETE SET NULL,
  contact_user_id uuid,
  contact_email text,
  contact_name text,
  title text NOT NULL DEFAULT 'Atendimento juridico',
  channel text NOT NULL DEFAULT 'portal',
  status text NOT NULL DEFAULT 'open',
  priority text NOT NULL DEFAULT 'normal',
  pipeline_stage text NOT NULL DEFAULT 'triagem',
  assigned_user_id uuid,
  fd_ticket_id bigint,
  source_metadata jsonb NOT NULL DEFAULT '{}',
  tags text[] NOT NULL DEFAULT '{}',
  last_message_at timestamptz,
  last_message_preview text,
  unread_client_count integer NOT NULL DEFAULT 0,
  unread_staff_count integer NOT NULL DEFAULT 0,
  archived_at timestamptz,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT crm_conversations_channel_chk CHECK (channel IN ('portal','whatsapp','email','freshdesk','instagram','facebook','telegram','webchat','interno')),
  CONSTRAINT crm_conversations_status_chk CHECK (status IN ('open','pending','waiting_client','waiting_staff','resolved','archived')),
  CONSTRAINT crm_conversations_priority_chk CHECK (priority IN ('low','normal','high','urgent')),
  CONSTRAINT crm_conversations_pipeline_stage_chk CHECK (pipeline_stage IN ('novo_lead','triagem','documentacao','diagnostico','plano_juridico','acao_judicial','pos_atendimento','encerrado'))
);

CREATE TABLE IF NOT EXISTS crm_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES portal_workspaces(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES crm_conversations(id) ON DELETE CASCADE,
  user_id uuid,
  email text,
  display_name text,
  role text NOT NULL DEFAULT 'client',
  participant_type text NOT NULL DEFAULT 'human',
  joined_at timestamptz NOT NULL DEFAULT now(),
  last_read_at timestamptz,
  muted_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}',
  CONSTRAINT crm_participants_role_chk CHECK (role IN ('client','advogado','operador','admin','superadmin','bot','observer')),
  CONSTRAINT crm_participants_type_chk CHECK (participant_type IN ('human','bot','integration')),
  CONSTRAINT crm_participants_identity_chk CHECK (user_id IS NOT NULL OR email IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS crm_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES portal_workspaces(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES crm_conversations(id) ON DELETE CASCADE,
  sender_participant_id uuid REFERENCES crm_participants(id) ON DELETE SET NULL,
  sender_user_id uuid,
  sender_role text NOT NULL DEFAULT 'client',
  body text NOT NULL DEFAULT '',
  body_format text NOT NULL DEFAULT 'plain',
  message_type text NOT NULL DEFAULT 'message',
  channel text NOT NULL DEFAULT 'portal',
  external_id text,
  reply_to_message_id uuid REFERENCES crm_messages(id) ON DELETE SET NULL,
  visible_to_client boolean NOT NULL DEFAULT true,
  delivery_status text NOT NULL DEFAULT 'sent',
  ai_summary text,
  ai_classification text,
  sentiment text,
  metadata jsonb NOT NULL DEFAULT '{}',
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('portuguese', coalesce(body, '')), 'A') ||
    setweight(to_tsvector('portuguese', coalesce(ai_summary, '')), 'B')
  ) STORED,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT crm_messages_sender_role_chk CHECK (sender_role IN ('client','advogado','operador','admin','superadmin','bot','integration')),
  CONSTRAINT crm_messages_body_format_chk CHECK (body_format IN ('plain','markdown','html')),
  CONSTRAINT crm_messages_type_chk CHECK (message_type IN ('message','internal_note','system_event','ticket_event','journey_event','document_event','ai_suggestion')),
  CONSTRAINT crm_messages_delivery_status_chk CHECK (delivery_status IN ('draft','sending','sent','delivered','read','failed'))
);

CREATE TABLE IF NOT EXISTS crm_message_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES portal_workspaces(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES crm_conversations(id) ON DELETE CASCADE,
  message_id uuid NOT NULL REFERENCES crm_messages(id) ON DELETE CASCADE,
  bucket_id text NOT NULL DEFAULT 'documentos',
  storage_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text,
  file_size bigint,
  checksum text,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crm_message_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES portal_workspaces(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES crm_conversations(id) ON DELETE CASCADE,
  message_id uuid NOT NULL REFERENCES crm_messages(id) ON DELETE CASCADE,
  participant_id uuid REFERENCES crm_participants(id) ON DELETE CASCADE,
  user_id uuid,
  read_at timestamptz NOT NULL DEFAULT now(),
  user_agent text,
  ip inet,
  UNIQUE (message_id, participant_id)
);

CREATE TABLE IF NOT EXISTS crm_message_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES portal_workspaces(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES crm_conversations(id) ON DELETE CASCADE,
  message_id uuid REFERENCES crm_messages(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  actor_user_id uuid,
  payload jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crm_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES portal_workspaces(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES crm_conversations(id) ON DELETE SET NULL,
  case_id uuid REFERENCES portal_casos(id) ON DELETE SET NULL,
  fd_ticket_id bigint,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'open',
  priority text NOT NULL DEFAULT 'normal',
  sla_due_at timestamptz,
  assigned_user_id uuid,
  source text NOT NULL DEFAULT 'portal',
  metadata jsonb NOT NULL DEFAULT '{}',
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  CONSTRAINT crm_tickets_status_chk CHECK (status IN ('open','pending','waiting_client','waiting_staff','resolved','closed')),
  CONSTRAINT crm_tickets_priority_chk CHECK (priority IN ('low','normal','high','urgent')),
  CONSTRAINT crm_tickets_source_chk CHECK (source IN ('portal','freshdesk','whatsapp','email','interno','automacao'))
);

CREATE TABLE IF NOT EXISTS crm_journeys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES portal_workspaces(id) ON DELETE CASCADE,
  case_id uuid REFERENCES portal_casos(id) ON DELETE SET NULL,
  conversation_id uuid REFERENCES crm_conversations(id) ON DELETE SET NULL,
  title text NOT NULL,
  journey_type text NOT NULL DEFAULT 'superendividamento',
  status text NOT NULL DEFAULT 'active',
  current_step_key text,
  assigned_user_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  CONSTRAINT crm_journeys_status_chk CHECK (status IN ('draft','active','paused','completed','cancelled'))
);

CREATE TABLE IF NOT EXISTS crm_journey_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES portal_workspaces(id) ON DELETE CASCADE,
  journey_id uuid NOT NULL REFERENCES crm_journeys(id) ON DELETE CASCADE,
  step_key text NOT NULL,
  title text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  required boolean NOT NULL DEFAULT true,
  automation_key text,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (journey_id, step_key)
);

CREATE TABLE IF NOT EXISTS crm_journey_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES portal_workspaces(id) ON DELETE CASCADE,
  journey_id uuid NOT NULL REFERENCES crm_journeys(id) ON DELETE CASCADE,
  step_id uuid REFERENCES crm_journey_steps(id) ON DELETE CASCADE,
  participant_id uuid REFERENCES crm_participants(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending',
  started_at timestamptz,
  completed_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT crm_journey_progress_status_chk CHECK (status IN ('pending','active','waiting','completed','skipped','blocked'))
);

CREATE TABLE IF NOT EXISTS crm_conversation_typing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES portal_workspaces(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES crm_conversations(id) ON DELETE CASCADE,
  participant_id uuid REFERENCES crm_participants(id) ON DELETE CASCADE,
  user_id uuid,
  is_typing boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (conversation_id, participant_id)
);

CREATE TABLE IF NOT EXISTS crm_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES portal_workspaces(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES crm_conversations(id) ON DELETE CASCADE,
  ticket_id uuid REFERENCES crm_tickets(id) ON DELETE SET NULL,
  journey_id uuid REFERENCES crm_journeys(id) ON DELETE SET NULL,
  actor_user_id uuid,
  event_type text NOT NULL,
  title text NOT NULL,
  detail text,
  payload jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'crm_conversations','crm_participants','crm_messages','crm_message_attachments',
    'crm_message_reads','crm_message_events','crm_tickets','crm_journeys',
    'crm_journey_steps','crm_journey_progress','crm_conversation_typing','crm_activity_logs'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_set_%I_tenant_id ON %I', table_name, table_name);
    EXECUTE format('CREATE TRIGGER trg_set_%I_tenant_id BEFORE INSERT ON %I FOR EACH ROW EXECUTE FUNCTION set_crm_tenant_id()', table_name, table_name);
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION can_access_crm_conversation(p_conversation_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    EXISTS (
      SELECT 1
      FROM crm_conversations c
      WHERE c.id = p_conversation_id
        AND (
          is_workspace_member_for(c.tenant_id, ARRAY['owner','admin','advogado','colaborador','financeiro','estagiario'])
          OR c.contact_user_id = auth.uid()
          OR EXISTS (
            SELECT 1
            FROM crm_participants p
            WHERE p.conversation_id = c.id
              AND p.user_id = auth.uid()
          )
          OR EXISTS (
            SELECT 1
            FROM portal_casos pc
            WHERE pc.id = c.case_id
              AND pc.user_id = auth.uid()
          )
        )
    ),
    false
  );
$$;

CREATE OR REPLACE FUNCTION can_write_crm_conversation(p_conversation_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    EXISTS (
      SELECT 1
      FROM crm_conversations c
      WHERE c.id = p_conversation_id
        AND (
          is_workspace_member_for(c.tenant_id, ARRAY['owner','admin','advogado','colaborador','financeiro'])
          OR c.contact_user_id = auth.uid()
          OR EXISTS (
            SELECT 1
            FROM crm_participants p
            WHERE p.conversation_id = c.id
              AND p.user_id = auth.uid()
              AND p.role IN ('client','advogado','operador','admin')
          )
        )
    ),
    false
  );
$$;

CREATE OR REPLACE FUNCTION touch_crm_conversation_from_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE crm_conversations
     SET last_message_at = NEW.created_at,
         last_message_preview = left(regexp_replace(NEW.body, '\s+', ' ', 'g'), 180),
         unread_client_count = CASE
           WHEN NEW.visible_to_client AND NEW.sender_role NOT IN ('client') THEN unread_client_count + 1
           ELSE unread_client_count
         END,
         unread_staff_count = CASE
           WHEN NEW.sender_role = 'client' THEN unread_staff_count + 1
           ELSE unread_staff_count
         END,
         updated_at = now()
   WHERE id = NEW.conversation_id;

  INSERT INTO crm_message_events (tenant_id, conversation_id, message_id, event_type, actor_user_id, payload)
  VALUES (NEW.tenant_id, NEW.conversation_id, NEW.id, 'message.created', NEW.sender_user_id, jsonb_build_object('channel', NEW.channel, 'message_type', NEW.message_type));

  INSERT INTO crm_activity_logs (tenant_id, conversation_id, actor_user_id, event_type, title, detail, payload)
  VALUES (NEW.tenant_id, NEW.conversation_id, NEW.sender_user_id, 'message.created', 'Mensagem registrada', left(NEW.body, 240), jsonb_build_object('message_id', NEW.id));

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_crm_conversation_from_message ON crm_messages;
CREATE TRIGGER trg_touch_crm_conversation_from_message
  AFTER INSERT ON crm_messages
  FOR EACH ROW EXECUTE FUNCTION touch_crm_conversation_from_message();

CREATE INDEX IF NOT EXISTS idx_crm_conversations_tenant_status
  ON crm_conversations (tenant_id, status, last_message_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_crm_conversations_assigned
  ON crm_conversations (tenant_id, assigned_user_id, status);
CREATE INDEX IF NOT EXISTS idx_crm_conversations_case
  ON crm_conversations (case_id) WHERE case_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_crm_conversations_fd_ticket
  ON crm_conversations (fd_ticket_id) WHERE fd_ticket_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_crm_conversations_tags
  ON crm_conversations USING gin (tags);

CREATE INDEX IF NOT EXISTS idx_crm_participants_conversation
  ON crm_participants (conversation_id, role);
CREATE INDEX IF NOT EXISTS idx_crm_participants_user
  ON crm_participants (user_id, conversation_id) WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_crm_messages_conversation_created
  ON crm_messages (conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_messages_tenant_created
  ON crm_messages (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_messages_search
  ON crm_messages USING gin (search_vector);
DO $$
DECLARE
  trgm_opclass text;
BEGIN
  /*
   * Supabase environments may install pg_trgm in different schemas
   * (for example public or extensions). Resolve the available opclass
   * dynamically to keep this migration portable and idempotent.
   */
  SELECT format('%I.%I', n.nspname, oc.opcname)
    INTO trgm_opclass
  FROM pg_opclass oc
  JOIN pg_namespace n ON n.oid = oc.opcnamespace
  JOIN pg_am am ON am.oid = oc.opcmethod
  WHERE am.amname = 'gin'
    AND oc.opcname = 'gin_trgm_ops'
  ORDER BY CASE n.nspname WHEN 'extensions' THEN 0 WHEN 'public' THEN 1 ELSE 2 END
  LIMIT 1;

  IF trgm_opclass IS NULL THEN
    RAISE NOTICE 'gin_trgm_ops not found; skipping idx_crm_messages_body_trgm';
  ELSE
    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS idx_crm_messages_body_trgm ON crm_messages USING gin (body %s)',
      trgm_opclass
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_crm_tickets_conversation
  ON crm_tickets (conversation_id, status);
CREATE INDEX IF NOT EXISTS idx_crm_journeys_case
  ON crm_journeys (case_id, status);
CREATE INDEX IF NOT EXISTS idx_crm_activity_conversation
  ON crm_activity_logs (conversation_id, created_at DESC);

DROP POLICY IF EXISTS crm_conversations_tenant_select ON crm_conversations;
DROP POLICY IF EXISTS crm_conversations_tenant_insert ON crm_conversations;
DROP POLICY IF EXISTS crm_conversations_tenant_update ON crm_conversations;
CREATE POLICY crm_conversations_tenant_select ON crm_conversations
  FOR SELECT TO authenticated
  USING (
    is_workspace_member_for(tenant_id, ARRAY['owner','admin','advogado','colaborador','financeiro','estagiario'])
    OR contact_user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM crm_participants p WHERE p.conversation_id = id AND p.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM portal_casos pc WHERE pc.id = case_id AND pc.user_id = auth.uid())
  );
CREATE POLICY crm_conversations_tenant_insert ON crm_conversations
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id IS NOT NULL
    AND (
      is_workspace_member_for(tenant_id, ARRAY['owner','admin','advogado','colaborador','financeiro'])
      OR contact_user_id = auth.uid()
    )
  );
CREATE POLICY crm_conversations_tenant_update ON crm_conversations
  FOR UPDATE TO authenticated
  USING (
    is_workspace_member_for(tenant_id, ARRAY['owner','admin','advogado','colaborador','financeiro'])
    OR contact_user_id = auth.uid()
  )
  WITH CHECK (
    is_workspace_member_for(tenant_id, ARRAY['owner','admin','advogado','colaborador','financeiro'])
    OR contact_user_id = auth.uid()
  );

DROP POLICY IF EXISTS crm_participants_conversation_select ON crm_participants;
DROP POLICY IF EXISTS crm_participants_conversation_write ON crm_participants;
CREATE POLICY crm_participants_conversation_select ON crm_participants
  FOR SELECT TO authenticated
  USING (can_access_crm_conversation(conversation_id));
CREATE POLICY crm_participants_conversation_write ON crm_participants
  FOR ALL TO authenticated
  USING (is_workspace_member_for(tenant_id, ARRAY['owner','admin','advogado','colaborador']) OR user_id = auth.uid())
  WITH CHECK (is_workspace_member_for(tenant_id, ARRAY['owner','admin','advogado','colaborador']) OR user_id = auth.uid());

DROP POLICY IF EXISTS crm_messages_conversation_select ON crm_messages;
DROP POLICY IF EXISTS crm_messages_conversation_insert ON crm_messages;
DROP POLICY IF EXISTS crm_messages_conversation_update ON crm_messages;
CREATE POLICY crm_messages_conversation_select ON crm_messages
  FOR SELECT TO authenticated
  USING (can_access_crm_conversation(conversation_id) AND (visible_to_client = true OR is_workspace_member_for(tenant_id, ARRAY['owner','admin','advogado','colaborador','financeiro','estagiario'])));
CREATE POLICY crm_messages_conversation_insert ON crm_messages
  FOR INSERT TO authenticated
  WITH CHECK (can_write_crm_conversation(conversation_id));
CREATE POLICY crm_messages_conversation_update ON crm_messages
  FOR UPDATE TO authenticated
  USING (is_workspace_member_for(tenant_id, ARRAY['owner','admin','advogado','colaborador']))
  WITH CHECK (is_workspace_member_for(tenant_id, ARRAY['owner','admin','advogado','colaborador']));

DROP POLICY IF EXISTS crm_related_select ON crm_message_attachments;
DROP POLICY IF EXISTS crm_related_write ON crm_message_attachments;
CREATE POLICY crm_related_select ON crm_message_attachments
  FOR SELECT TO authenticated
  USING (can_access_crm_conversation(conversation_id));
CREATE POLICY crm_related_write ON crm_message_attachments
  FOR ALL TO authenticated
  USING (can_write_crm_conversation(conversation_id))
  WITH CHECK (can_write_crm_conversation(conversation_id));

DROP POLICY IF EXISTS crm_reads_select ON crm_message_reads;
DROP POLICY IF EXISTS crm_reads_insert ON crm_message_reads;
CREATE POLICY crm_reads_select ON crm_message_reads
  FOR SELECT TO authenticated
  USING (can_access_crm_conversation(conversation_id));
CREATE POLICY crm_reads_insert ON crm_message_reads
  FOR INSERT TO authenticated
  WITH CHECK (can_access_crm_conversation(conversation_id) AND (user_id = auth.uid() OR is_workspace_member_for(tenant_id, ARRAY['owner','admin','advogado','colaborador','financeiro','estagiario'])));

DROP POLICY IF EXISTS crm_events_select ON crm_message_events;
DROP POLICY IF EXISTS crm_events_insert ON crm_message_events;
CREATE POLICY crm_events_select ON crm_message_events
  FOR SELECT TO authenticated
  USING (can_access_crm_conversation(conversation_id));
CREATE POLICY crm_events_insert ON crm_message_events
  FOR INSERT TO authenticated
  WITH CHECK (can_write_crm_conversation(conversation_id));

DROP POLICY IF EXISTS crm_tickets_tenant_select ON crm_tickets;
DROP POLICY IF EXISTS crm_tickets_tenant_write ON crm_tickets;
CREATE POLICY crm_tickets_tenant_select ON crm_tickets
  FOR SELECT TO authenticated
  USING (
    is_workspace_member_for(tenant_id, ARRAY['owner','admin','advogado','colaborador','financeiro','estagiario'])
    OR can_access_crm_conversation(conversation_id)
    OR EXISTS (SELECT 1 FROM portal_casos pc WHERE pc.id = case_id AND pc.user_id = auth.uid())
  );
CREATE POLICY crm_tickets_tenant_write ON crm_tickets
  FOR ALL TO authenticated
  USING (is_workspace_member_for(tenant_id, ARRAY['owner','admin','advogado','colaborador']))
  WITH CHECK (is_workspace_member_for(tenant_id, ARRAY['owner','admin','advogado','colaborador']));

DROP POLICY IF EXISTS crm_journeys_tenant_select ON crm_journeys;
DROP POLICY IF EXISTS crm_journeys_tenant_write ON crm_journeys;
CREATE POLICY crm_journeys_tenant_select ON crm_journeys
  FOR SELECT TO authenticated
  USING (
    is_workspace_member_for(tenant_id, ARRAY['owner','admin','advogado','colaborador','financeiro','estagiario'])
    OR can_access_crm_conversation(conversation_id)
    OR EXISTS (SELECT 1 FROM portal_casos pc WHERE pc.id = case_id AND pc.user_id = auth.uid())
  );
CREATE POLICY crm_journeys_tenant_write ON crm_journeys
  FOR ALL TO authenticated
  USING (is_workspace_member_for(tenant_id, ARRAY['owner','admin','advogado','colaborador']))
  WITH CHECK (is_workspace_member_for(tenant_id, ARRAY['owner','admin','advogado','colaborador']));

DROP POLICY IF EXISTS crm_journey_children_select ON crm_journey_steps;
DROP POLICY IF EXISTS crm_journey_children_write ON crm_journey_steps;
CREATE POLICY crm_journey_children_select ON crm_journey_steps
  FOR SELECT TO authenticated
  USING (is_workspace_member_for(tenant_id, ARRAY['owner','admin','advogado','colaborador','financeiro','estagiario']));
CREATE POLICY crm_journey_children_write ON crm_journey_steps
  FOR ALL TO authenticated
  USING (is_workspace_member_for(tenant_id, ARRAY['owner','admin','advogado','colaborador']))
  WITH CHECK (is_workspace_member_for(tenant_id, ARRAY['owner','admin','advogado','colaborador']));

DROP POLICY IF EXISTS crm_progress_select ON crm_journey_progress;
DROP POLICY IF EXISTS crm_progress_write ON crm_journey_progress;
CREATE POLICY crm_progress_select ON crm_journey_progress
  FOR SELECT TO authenticated
  USING (is_workspace_member_for(tenant_id, ARRAY['owner','admin','advogado','colaborador','financeiro','estagiario']) OR participant_id IN (SELECT id FROM crm_participants WHERE user_id = auth.uid()));
CREATE POLICY crm_progress_write ON crm_journey_progress
  FOR ALL TO authenticated
  USING (is_workspace_member_for(tenant_id, ARRAY['owner','admin','advogado','colaborador']) OR participant_id IN (SELECT id FROM crm_participants WHERE user_id = auth.uid()))
  WITH CHECK (is_workspace_member_for(tenant_id, ARRAY['owner','admin','advogado','colaborador']) OR participant_id IN (SELECT id FROM crm_participants WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS crm_typing_select ON crm_conversation_typing;
DROP POLICY IF EXISTS crm_typing_write ON crm_conversation_typing;
CREATE POLICY crm_typing_select ON crm_conversation_typing
  FOR SELECT TO authenticated
  USING (can_access_crm_conversation(conversation_id));
CREATE POLICY crm_typing_write ON crm_conversation_typing
  FOR ALL TO authenticated
  USING (can_write_crm_conversation(conversation_id))
  WITH CHECK (can_write_crm_conversation(conversation_id));

DROP POLICY IF EXISTS crm_activity_select ON crm_activity_logs;
DROP POLICY IF EXISTS crm_activity_insert ON crm_activity_logs;
CREATE POLICY crm_activity_select ON crm_activity_logs
  FOR SELECT TO authenticated
  USING (conversation_id IS NULL OR can_access_crm_conversation(conversation_id) OR is_workspace_member_for(tenant_id, ARRAY['owner','admin','advogado','colaborador','financeiro','estagiario']));
CREATE POLICY crm_activity_insert ON crm_activity_logs
  FOR INSERT TO authenticated
  WITH CHECK (is_workspace_member_for(tenant_id, ARRAY['owner','admin','advogado','colaborador','financeiro','estagiario']) OR can_write_crm_conversation(conversation_id));

GRANT SELECT, INSERT, UPDATE ON
  crm_conversations,
  crm_participants,
  crm_messages,
  crm_message_attachments,
  crm_message_reads,
  crm_message_events,
  crm_tickets,
  crm_journeys,
  crm_journey_steps,
  crm_journey_progress,
  crm_conversation_typing,
  crm_activity_logs
TO authenticated;

GRANT EXECUTE ON FUNCTION can_access_crm_conversation(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION can_write_crm_conversation(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION current_workspace_id() TO authenticated;

CREATE OR REPLACE VIEW vw_crm_inbox WITH (security_invoker = true) AS
SELECT
  c.id,
  c.tenant_id,
  c.case_id,
  c.contact_user_id,
  c.contact_email,
  c.contact_name,
  c.title,
  c.channel,
  c.status,
  c.priority,
  c.pipeline_stage,
  c.assigned_user_id,
  c.fd_ticket_id,
  c.tags,
  c.last_message_at,
  c.last_message_preview,
  c.unread_client_count,
  c.unread_staff_count,
  c.archived_at,
  c.created_at,
  c.updated_at,
  pc.full_name AS case_client_name,
  pc.cpf AS case_client_cpf,
  pc.numero_processo,
  t.id AS crm_ticket_id,
  t.status AS ticket_status,
  t.sla_due_at,
  j.id AS active_journey_id,
  j.current_step_key
FROM crm_conversations c
LEFT JOIN portal_casos pc ON pc.id = c.case_id
LEFT JOIN LATERAL (
  SELECT *
  FROM crm_tickets t
  WHERE t.conversation_id = c.id
  ORDER BY t.created_at DESC
  LIMIT 1
) t ON true
LEFT JOIN LATERAL (
  SELECT *
  FROM crm_journeys j
  WHERE j.conversation_id = c.id
    AND j.status IN ('active','paused')
  ORDER BY j.created_at DESC
  LIMIT 1
) j ON true;

GRANT SELECT ON vw_crm_inbox TO authenticated;

DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE crm_conversations; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE crm_participants; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE crm_messages; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE crm_message_reads; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE crm_message_events; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE crm_tickets; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE crm_journeys; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE crm_journey_progress; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE crm_conversation_typing; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE crm_activity_logs; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMENT ON TABLE crm_conversations IS 'Entidade raiz da inbox juridica. Nenhuma conversa deve ser inferida no frontend.';
COMMENT ON TABLE crm_messages IS 'Mensagens realtime com fulltext, status de entrega, IA e suporte a anexos.';
COMMENT ON TABLE crm_tickets IS 'Ticket operacional interno vinculado a conversa e espelho Freshdesk quando existir.';
COMMENT ON TABLE crm_journeys IS 'Jornadas conversacionais do caso: onboarding, documentos, plano e pos-atendimento.';
COMMENT ON VIEW vw_crm_inbox IS 'View de inbox para admin/cliente com conversa, caso, ticket, SLA e jornada ativa.';
