-- Portal financial tables: planos_pagamento, custas, contratos

-- ── portal_planos_pagamento ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.portal_planos_pagamento (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  caso_id          uuid REFERENCES public.portal_casos(id) ON DELETE SET NULL,
  titulo           text NOT NULL DEFAULT '',
  status           text NOT NULL DEFAULT 'ativo'
                     CHECK (status IN ('ativo','pausado','concluido','cancelado')),
  valor_total      numeric(12,2) NOT NULL DEFAULT 0,
  parcela_sugerida numeric(12,2),
  prazo_meses      integer,
  cronograma       jsonb,
  observacao       text,
  deleted_at       timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.portal_planos_pagamento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_planos" ON public.portal_planos_pagamento
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

CREATE POLICY "owner_select_planos" ON public.portal_planos_pagamento
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ── portal_custas ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.portal_custas (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  caso_id         uuid REFERENCES public.portal_casos(id) ON DELETE SET NULL,
  titulo          text,
  categoria       text,
  status          text NOT NULL DEFAULT 'pendente'
                    CHECK (status IN ('pendente','pago','vencido','cancelado')),
  valor           numeric(12,2),
  data_vencimento date,
  deleted_at      timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.portal_custas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_custas" ON public.portal_custas
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

CREATE POLICY "owner_select_custas" ON public.portal_custas
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ── portal_contratos ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.portal_contratos (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  caso_id           uuid REFERENCES public.portal_casos(id) ON DELETE SET NULL,
  titulo            text,
  tipo              text,
  status            text NOT NULL DEFAULT 'rascunho'
                      CHECK (status IN ('rascunho','ativo','assinado','encerrado')),
  assinatura_status text CHECK (assinatura_status IN ('pendente','assinado','recusado')),
  assinado_em       timestamptz,
  arquivo_url       text,
  deleted_at        timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.portal_contratos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_contratos" ON public.portal_contratos
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

CREATE POLICY "owner_select_contratos" ON public.portal_contratos
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
