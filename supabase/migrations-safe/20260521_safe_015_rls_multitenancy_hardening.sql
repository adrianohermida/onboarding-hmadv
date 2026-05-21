-- =============================================================================
-- MIGRATION 015 — Hardening RLS + isolamento multi-tenant
-- Portal: Hermida Maia Advocacia
-- =============================================================================
-- Objetivo:
--   Reduzir risco de vazamento cross-tenant separando master admin de admin de
--   escritório, escopando registros operacionais por workspace e reforçando
--   policies de casos, documentos, dívidas, timeline, notificações e storage.
-- =============================================================================

CREATE OR REPLACE FUNCTION is_master_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
    OR EXISTS (
      SELECT 1
      FROM admin_profiles
      WHERE id = auth.uid()
        AND is_active = true
        AND is_platform_admin = true
    ),
    false
  );
$$;

COMMENT ON FUNCTION is_master_admin()
  IS 'Admin master/plataforma. Diferente de admin de escritório, pode atravessar workspaces.';

CREATE OR REPLACE FUNCTION is_workspace_member_for(p_workspace_id uuid, p_roles text[] DEFAULT ARRAY['owner','admin','advogado','colaborador','financeiro','estagiario','member'])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    is_master_admin()
    OR EXISTS (
      SELECT 1
      FROM portal_workspace_members pwm
      WHERE pwm.workspace_id = p_workspace_id
        AND pwm.user_id = auth.uid()
        AND pwm.is_active = true
        AND pwm.role = ANY(p_roles)
    ),
    false
  );
$$;

COMMENT ON FUNCTION is_workspace_member_for(uuid, text[])
  IS 'Verifica participação ativa do usuário no workspace com papéis permitidos.';

CREATE OR REPLACE FUNCTION current_workspace_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT workspace_id
     FROM portal_workspace_members
     WHERE user_id = auth.uid()
       AND is_active = true
     ORDER BY
       CASE role
         WHEN 'owner' THEN 1
         WHEN 'admin' THEN 2
         WHEN 'advogado' THEN 3
         WHEN 'colaborador' THEN 4
         WHEN 'financeiro' THEN 5
         ELSE 9
       END,
       joined_at
     LIMIT 1),
    (SELECT id FROM portal_workspaces WHERE slug = 'hmadv-principal' LIMIT 1)
  );
$$;

CREATE OR REPLACE FUNCTION _set_operational_workspace_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.workspace_id IS NULL THEN
    NEW.workspace_id := current_workspace_id();
  END IF;
  RETURN NEW;
END;
$$;

ALTER TABLE portal_operational_records
  ADD COLUMN IF NOT EXISTS tenant_guard text NOT NULL DEFAULT 'workspace';

DROP TRIGGER IF EXISTS trg_set_operational_workspace_id ON portal_operational_records;
CREATE TRIGGER trg_set_operational_workspace_id
  BEFORE INSERT ON portal_operational_records
  FOR EACH ROW EXECUTE FUNCTION _set_operational_workspace_id();

ALTER TABLE portal_operational_record_audit
  ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES portal_workspaces(id) ON DELETE SET NULL;

UPDATE portal_operational_record_audit audit
SET workspace_id = rec.workspace_id
FROM portal_operational_records rec
WHERE audit.record_id = rec.id
  AND audit.workspace_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_portal_operational_audit_workspace
  ON portal_operational_record_audit(workspace_id, created_at DESC)
  WHERE workspace_id IS NOT NULL;

CREATE OR REPLACE FUNCTION _set_operational_audit_workspace_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.workspace_id IS NULL AND NEW.record_id IS NOT NULL THEN
    SELECT workspace_id INTO NEW.workspace_id
    FROM portal_operational_records
    WHERE id = NEW.record_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_operational_audit_workspace_id ON portal_operational_record_audit;
CREATE TRIGGER trg_set_operational_audit_workspace_id
  BEFORE INSERT ON portal_operational_record_audit
  FOR EACH ROW EXECUTE FUNCTION _set_operational_audit_workspace_id();

-- Registros operacionais: remover admin amplo e reabrir por master/workspace.
DROP POLICY IF EXISTS admin_operational_records_all ON portal_operational_records;
DROP POLICY IF EXISTS operational_records_master_all ON portal_operational_records;
DROP POLICY IF EXISTS operational_records_workspace_select ON portal_operational_records;
DROP POLICY IF EXISTS operational_records_workspace_insert ON portal_operational_records;
DROP POLICY IF EXISTS operational_records_workspace_update ON portal_operational_records;

CREATE POLICY operational_records_master_all
  ON portal_operational_records FOR ALL TO authenticated
  USING (is_master_admin())
  WITH CHECK (is_master_admin());

CREATE POLICY operational_records_workspace_select
  ON portal_operational_records FOR SELECT TO authenticated
  USING (workspace_id IS NOT NULL AND is_workspace_member_for(workspace_id));

CREATE POLICY operational_records_workspace_insert
  ON portal_operational_records FOR INSERT TO authenticated
  WITH CHECK (
    workspace_id IS NOT NULL
    AND is_workspace_member_for(workspace_id, ARRAY['owner','admin','advogado','colaborador','financeiro'])
  );

CREATE POLICY operational_records_workspace_update
  ON portal_operational_records FOR UPDATE TO authenticated
  USING (
    workspace_id IS NOT NULL
    AND is_workspace_member_for(workspace_id, ARRAY['owner','admin','advogado','colaborador','financeiro'])
  )
  WITH CHECK (
    workspace_id IS NOT NULL
    AND is_workspace_member_for(workspace_id, ARRAY['owner','admin','advogado','colaborador','financeiro'])
  );

DROP POLICY IF EXISTS admin_operational_record_audit_all ON portal_operational_record_audit;
DROP POLICY IF EXISTS operational_audit_master_all ON portal_operational_record_audit;
DROP POLICY IF EXISTS operational_audit_workspace_select ON portal_operational_record_audit;
DROP POLICY IF EXISTS operational_audit_workspace_insert ON portal_operational_record_audit;

CREATE POLICY operational_audit_master_all
  ON portal_operational_record_audit FOR ALL TO authenticated
  USING (is_master_admin())
  WITH CHECK (is_master_admin());

CREATE POLICY operational_audit_workspace_select
  ON portal_operational_record_audit FOR SELECT TO authenticated
  USING (workspace_id IS NOT NULL AND is_workspace_member_for(workspace_id));

CREATE POLICY operational_audit_workspace_insert
  ON portal_operational_record_audit FOR INSERT TO authenticated
  WITH CHECK (
    workspace_id IS NOT NULL
    AND is_workspace_member_for(workspace_id, ARRAY['owner','admin','advogado','colaborador','financeiro'])
  );

-- Policies legadas amplas: master atravessa, escritório fica no workspace.
DROP POLICY IF EXISTS admin_all_casos ON portal_casos;
DROP POLICY IF EXISTS casos_master_all ON portal_casos;
DROP POLICY IF EXISTS casos_workspace_staff_all ON portal_casos;

CREATE POLICY casos_master_all
  ON portal_casos FOR ALL TO authenticated
  USING (is_master_admin())
  WITH CHECK (is_master_admin());

CREATE POLICY casos_workspace_staff_all
  ON portal_casos FOR ALL TO authenticated
  USING (workspace_id IS NOT NULL AND is_workspace_member_for(workspace_id, ARRAY['owner','admin','advogado','colaborador']))
  WITH CHECK (workspace_id IS NOT NULL AND is_workspace_member_for(workspace_id, ARRAY['owner','admin','advogado','colaborador']));

DROP POLICY IF EXISTS admin_all_docs ON portal_documentos;
DROP POLICY IF EXISTS workspace_admin_documentos ON portal_documentos;
DROP POLICY IF EXISTS documentos_master_all ON portal_documentos;
DROP POLICY IF EXISTS documentos_workspace_staff_all ON portal_documentos;

CREATE POLICY documentos_master_all
  ON portal_documentos FOR ALL TO authenticated
  USING (is_master_admin())
  WITH CHECK (is_master_admin());

CREATE POLICY documentos_workspace_staff_all
  ON portal_documentos FOR ALL TO authenticated
  USING (workspace_id IS NOT NULL AND is_workspace_member_for(workspace_id, ARRAY['owner','admin','advogado','colaborador']))
  WITH CHECK (workspace_id IS NOT NULL AND is_workspace_member_for(workspace_id, ARRAY['owner','admin','advogado','colaborador']));

DROP POLICY IF EXISTS admin_all_dividas ON portal_dividas;
DROP POLICY IF EXISTS workspace_admin_dividas ON portal_dividas;
DROP POLICY IF EXISTS dividas_master_all ON portal_dividas;
DROP POLICY IF EXISTS dividas_workspace_staff_all ON portal_dividas;

CREATE POLICY dividas_master_all
  ON portal_dividas FOR ALL TO authenticated
  USING (is_master_admin())
  WITH CHECK (is_master_admin());

CREATE POLICY dividas_workspace_staff_all
  ON portal_dividas FOR ALL TO authenticated
  USING (workspace_id IS NOT NULL AND is_workspace_member_for(workspace_id, ARRAY['owner','admin','advogado','colaborador','financeiro']))
  WITH CHECK (workspace_id IS NOT NULL AND is_workspace_member_for(workspace_id, ARRAY['owner','admin','advogado','colaborador','financeiro']));

DROP POLICY IF EXISTS admin_all_timeline ON portal_cnj_timeline;
DROP POLICY IF EXISTS timeline_admin_all ON portal_cnj_timeline;
DROP POLICY IF EXISTS timeline_master_all ON portal_cnj_timeline;
DROP POLICY IF EXISTS timeline_workspace_staff_all ON portal_cnj_timeline;

CREATE POLICY timeline_master_all
  ON portal_cnj_timeline FOR ALL TO authenticated
  USING (is_master_admin())
  WITH CHECK (is_master_admin());

CREATE POLICY timeline_workspace_staff_all
  ON portal_cnj_timeline FOR ALL TO authenticated
  USING (workspace_id IS NOT NULL AND is_workspace_member_for(workspace_id, ARRAY['owner','admin','advogado','colaborador']))
  WITH CHECK (workspace_id IS NOT NULL AND is_workspace_member_for(workspace_id, ARRAY['owner','admin','advogado','colaborador']));

DROP POLICY IF EXISTS admin_all_notifications ON portal_cnj_notifications;
DROP POLICY IF EXISTS notif_admin_all ON portal_cnj_notifications;
DROP POLICY IF EXISTS notifications_master_all ON portal_cnj_notifications;
DROP POLICY IF EXISTS notifications_workspace_staff_all ON portal_cnj_notifications;

CREATE POLICY notifications_master_all
  ON portal_cnj_notifications FOR ALL TO authenticated
  USING (is_master_admin())
  WITH CHECK (is_master_admin());

CREATE POLICY notifications_workspace_staff_all
  ON portal_cnj_notifications FOR ALL TO authenticated
  USING (workspace_id IS NOT NULL AND is_workspace_member_for(workspace_id, ARRAY['owner','admin','advogado','colaborador']))
  WITH CHECK (workspace_id IS NOT NULL AND is_workspace_member_for(workspace_id, ARRAY['owner','admin','advogado','colaborador']));

-- Storage: leitura/escrita por dono do arquivo ou equipe do workspace.
CREATE OR REPLACE FUNCTION can_access_portal_document_path(p_name text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  parts text[];
  workspace uuid;
  owner_segment text;
BEGIN
  parts := storage.foldername(p_name);
  IF array_length(parts, 1) < 2 THEN
    RETURN false;
  END IF;

  owner_segment := parts[2];
  IF owner_segment = auth.uid()::text THEN
    RETURN true;
  END IF;

  BEGIN
    workspace := parts[1]::uuid;
  EXCEPTION WHEN invalid_text_representation THEN
    RETURN false;
  END;

  RETURN is_workspace_member_for(workspace, ARRAY['owner','admin','advogado','colaborador']);
END;
$$;

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS portal_documentos_storage_select ON storage.objects;
DROP POLICY IF EXISTS portal_documentos_storage_insert ON storage.objects;
DROP POLICY IF EXISTS portal_documentos_storage_update ON storage.objects;

CREATE POLICY portal_documentos_storage_select
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'portal-documentos' AND can_access_portal_document_path(name));

CREATE POLICY portal_documentos_storage_insert
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'portal-documentos' AND can_access_portal_document_path(name));

CREATE POLICY portal_documentos_storage_update
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'portal-documentos' AND can_access_portal_document_path(name))
  WITH CHECK (bucket_id = 'portal-documentos' AND can_access_portal_document_path(name));

GRANT EXECUTE ON FUNCTION is_master_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_workspace_member_for(uuid, text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION current_workspace_id() TO authenticated;
GRANT EXECUTE ON FUNCTION can_access_portal_document_path(text) TO authenticated;
