-- Sprint 7: Plataforma de conformidade processual CNJ
-- Lei 14.181/2021 + Recomendação CNJ 125/2021 (Anexo II)
-- Aplicado em: 2026-05-20

ALTER TABLE portal_casos
  ADD COLUMN IF NOT EXISTS situacao_profissional      TEXT,
  ADD COLUMN IF NOT EXISTS renda_familiar             DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS despesas                   JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS patrimonio                 JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS causas_endividamento       JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS negativacoes               JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS conhecimento_credito       JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS credores_cnj               JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS comprometimento_mensal     DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS plano_pagamento            JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS cnj_json                   JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS cnj_step_atual             SMALLINT DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_portal_casos_cnj_step
  ON portal_casos (cnj_step_atual);

COMMENT ON COLUMN portal_casos.situacao_profissional  IS 'CNJ §2b: empregado_formal|autonomo|desempregado|aposentado|outros';
COMMENT ON COLUMN portal_casos.renda_familiar         IS 'CNJ §2f: renda bruta mensal familiar';
COMMENT ON COLUMN portal_casos.despesas               IS 'CNJ §2d: {luz,aluguel,condominio,agua,internet,alimentacao,pensao,educacao,plano_saude,medicamentos,impostos,outras}';
COMMENT ON COLUMN portal_casos.patrimonio             IS 'CNJ §2g-i: imovel e veiculo';
COMMENT ON COLUMN portal_casos.causas_endividamento   IS 'CNJ §2j: array de causas do endividamento';
COMMENT ON COLUMN portal_casos.negativacoes           IS 'CNJ §2m-o: Serasa/SPC/protestos/acoes_judiciais';
COMMENT ON COLUMN portal_casos.credores_cnj           IS 'CNJ §3: Mapa de credores completo com campos de conformidade';
COMMENT ON COLUMN portal_casos.plano_pagamento        IS 'art. 104-A CDC: {prazo_meses, carencia_meses, renda_disponivel, parcela_possivel}';
COMMENT ON COLUMN portal_casos.cnj_json               IS 'JSON estruturado CNJ gerado pelo cnj-engine.js para petições/Freshdesk';
COMMENT ON COLUMN portal_casos.cnj_step_atual         IS 'Último step concluído no formulário CNJ (1-7)';
