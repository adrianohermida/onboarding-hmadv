-- =============================================================================
-- MIGRATION 017 -- Módulos cliente dedicados + vínculos explícitos de Partes
-- Portal: Hermida Maia Advocacia
-- =============================================================================
-- Objetivo:
--   1) Persistir Custas, Contratos e Planos de Pagamento em tabelas dedicadas.
--   2) Fechar módulo Partes com relacionamento explícito processo-plano-cliente.
-- =============================================================================

CREATE TABLE IF NOT EXISTS portal_custas (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  caso_id            uuid REFERENCES portal_casos(id) ON DELETE SET NULL,
  workspace_id       uuid REFERENCES portal_workspaces(id) ON DELETE SET NULL,
  titulo             text,
  descricao          text,
  categoria          text NOT NULL DEFAULT 'guia',
  status             text NOT NULL DEFAULT 'pendente',
  processo_id        uuid,
  valor              numeric(14,2) NOT NULL DEFAULT 0,
  data_lancamento    timestamptz NOT NULL DEFAULT now(),
  data_vencimento    date,
  comprovante_url    text,
  comprovante_nome   text,
  metadata           jsonb NOT NULL DEFAULT '{}',
  deleted_at         timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_portal_custas_user_id ON portal_custas(user_id);
CREATE INDEX IF NOT EXISTS idx_portal_custas_caso_id ON portal_custas(caso_id);
CREATE INDEX IF NOT EXISTS idx_portal_custas_workspace ON portal_custas(workspace_id) WHERE workspace_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_portal_custas_status ON portal_custas(status, data_lancamento DESC);

DROP TRIGGER IF EXISTS trg_portal_custas_updated_at ON portal_custas;
CREATE TRIGGER trg_portal_custas_updated_at
  BEFORE UPDATE ON portal_custas FOR EACH ROW EXECUTE FUNCTION _set_updated_at();

ALTER TABLE portal_custas ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='portal_custas' AND policyname='own_portal_custas') THEN
    CREATE POLICY own_portal_custas ON portal_custas FOR ALL TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='portal_custas' AND policyname='admin_portal_custas_all') THEN
    CREATE POLICY admin_portal_custas_all ON portal_custas FOR ALL TO authenticated
      USING (is_any_admin())
      WITH CHECK (is_any_admin());
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS portal_contratos (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  caso_id            uuid REFERENCES portal_casos(id) ON DELETE SET NULL,
  workspace_id       uuid REFERENCES portal_workspaces(id) ON DELETE SET NULL,
  titulo             text NOT NULL,
  tipo               text,
  status             text NOT NULL DEFAULT 'rascunho',
  processo_id        uuid,
  assinatura_status  text,
  assinado_em        timestamptz,
  arquivo_url        text,
  metadata           jsonb NOT NULL DEFAULT '{}',
  deleted_at         timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_portal_contratos_user_id ON portal_contratos(user_id);
CREATE INDEX IF NOT EXISTS idx_portal_contratos_caso_id ON portal_contratos(caso_id);
CREATE INDEX IF NOT EXISTS idx_portal_contratos_workspace ON portal_contratos(workspace_id) WHERE workspace_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_portal_contratos_status ON portal_contratos(status, updated_at DESC);

DROP TRIGGER IF EXISTS trg_portal_contratos_updated_at ON portal_contratos;
CREATE TRIGGER trg_portal_contratos_updated_at
  BEFORE UPDATE ON portal_contratos FOR EACH ROW EXECUTE FUNCTION _set_updated_at();

ALTER TABLE portal_contratos ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='portal_contratos' AND policyname='own_portal_contratos') THEN
    CREATE POLICY own_portal_contratos ON portal_contratos FOR ALL TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='portal_contratos' AND policyname='admin_portal_contratos_all') THEN
    CREATE POLICY admin_portal_contratos_all ON portal_contratos FOR ALL TO authenticated
      USING (is_any_admin())
      WITH CHECK (is_any_admin());
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS portal_planos_pagamento (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  caso_id            uuid REFERENCES portal_casos(id) ON DELETE SET NULL,
  workspace_id       uuid REFERENCES portal_workspaces(id) ON DELETE SET NULL,
  titulo             text NOT NULL DEFAULT 'Plano sugerido',
  status             text NOT NULL DEFAULT 'em_analise',
  valor_total        numeric(14,2) NOT NULL DEFAULT 0,
  parcela_sugerida   numeric(14,2) NOT NULL DEFAULT 0,
  prazo_meses        integer NOT NULL DEFAULT 0,
  cronograma         jsonb NOT NULL DEFAULT '[]',
  observacao         text,
  source             text NOT NULL DEFAULT 'portal_cliente',
  metadata           jsonb NOT NULL DEFAULT '{}',
  deleted_at         timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, titulo)
);

CREATE INDEX IF NOT EXISTS idx_portal_planos_pagamento_user_id ON portal_planos_pagamento(user_id);
CREATE INDEX IF NOT EXISTS idx_portal_planos_pagamento_caso_id ON portal_planos_pagamento(caso_id);
CREATE INDEX IF NOT EXISTS idx_portal_planos_pagamento_workspace ON portal_planos_pagamento(workspace_id) WHERE workspace_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_portal_planos_pagamento_status ON portal_planos_pagamento(status, created_at DESC);

DROP TRIGGER IF EXISTS trg_portal_planos_pagamento_updated_at ON portal_planos_pagamento;
CREATE TRIGGER trg_portal_planos_pagamento_updated_at
  BEFORE UPDATE ON portal_planos_pagamento FOR EACH ROW EXECUTE FUNCTION _set_updated_at();

ALTER TABLE portal_planos_pagamento ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='portal_planos_pagamento' AND policyname='own_portal_planos_pagamento') THEN
    CREATE POLICY own_portal_planos_pagamento ON portal_planos_pagamento FOR ALL TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='portal_planos_pagamento' AND policyname='admin_portal_planos_pagamento_all') THEN
    CREATE POLICY admin_portal_planos_pagamento_all ON portal_planos_pagamento FOR ALL TO authenticated
      USING (is_any_admin())
      WITH CHECK (is_any_admin());
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS portal_partes_vinculos (
  id                           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id                 uuid REFERENCES portal_workspaces(id) ON DELETE SET NULL,
  processo_id                  text NOT NULL,
  plano_pagamento_id           text,
  cliente_user_id              uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  caso_id                      uuid REFERENCES portal_casos(id) ON DELETE SET NULL,
  vinculo_status               text NOT NULL DEFAULT 'ativo',
  tenant_id                    text,
  nome                         text NOT NULL,
  tipo                         text,
  polo                         text,
  documento                    text,
  contact_id_freshsales        text,
  tipo_pessoa                  text,
  advogados                    text,
  fonte                        text,
  representada_pelo_escritorio text,
  cliente_hmadv                text,
  contato_freshsales_id        text,
  principal_no_account         text,
  observacao                   text,
  status                       text NOT NULL DEFAULT 'ativa',
  archived_at                  timestamptz,
  deleted_at                   timestamptz,
  created_by                   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by                   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at                   timestamptz NOT NULL DEFAULT now(),
  updated_at                   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_portal_partes_vinculos_processo ON portal_partes_vinculos(processo_id, deleted_at);
CREATE INDEX IF NOT EXISTS idx_portal_partes_vinculos_plano ON portal_partes_vinculos(plano_pagamento_id, deleted_at);
CREATE INDEX IF NOT EXISTS idx_portal_partes_vinculos_cliente ON portal_partes_vinculos(cliente_user_id, deleted_at);
CREATE INDEX IF NOT EXISTS idx_portal_partes_vinculos_vinculo ON portal_partes_vinculos(vinculo_status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_portal_partes_vinculos_workspace ON portal_partes_vinculos(workspace_id) WHERE workspace_id IS NOT NULL;

DROP TRIGGER IF EXISTS trg_portal_partes_vinculos_updated_at ON portal_partes_vinculos;
CREATE TRIGGER trg_portal_partes_vinculos_updated_at
  BEFORE UPDATE ON portal_partes_vinculos FOR EACH ROW EXECUTE FUNCTION _set_updated_at();

ALTER TABLE portal_partes_vinculos ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='portal_partes_vinculos' AND policyname='admin_portal_partes_vinculos_all') THEN
    CREATE POLICY admin_portal_partes_vinculos_all ON portal_partes_vinculos FOR ALL TO authenticated
      USING (is_any_admin())
      WITH CHECK (is_any_admin());
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE ON portal_custas TO authenticated;
GRANT SELECT, INSERT, UPDATE ON portal_contratos TO authenticated;
GRANT SELECT, INSERT, UPDATE ON portal_planos_pagamento TO authenticated;
GRANT SELECT, INSERT, UPDATE ON portal_partes_vinculos TO authenticated;

COMMENT ON TABLE portal_custas IS 'Custas processuais do cliente em tabela dedicada por caso/workspace.';
COMMENT ON TABLE portal_contratos IS 'Contratos do cliente com workflow e trilha de assinatura em tabela dedicada.';
COMMENT ON TABLE portal_planos_pagamento IS 'Planos de pagamento persistidos para o cliente com cronograma e proposta consolidada.';
COMMENT ON TABLE portal_partes_vinculos IS 'Vínculos explícitos do módulo Partes entre processo, plano e cliente.';
