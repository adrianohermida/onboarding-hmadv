import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import MeuCasoHub from '@/components/meu-caso/MeuCasoHub';

export const metadata: Metadata = { title: 'Meu Caso' };

export default async function MeuCasoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: caso }, { data: documentos }, { data: plano }, { data: processos }, { data: prazos }] =
    await Promise.all([
      supabase
        .from('casos')
        .select('id, fase, cnj_step_atual, nome_cliente, status, created_at')
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('portal_documentos')
        .select('id, nome, workflow_status, tipo')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('re_planos_pagamento')
        .select('id, status, valor_total, total_parcelas, parcelas_pagas, data_inicio')
        .eq('user_id', user.id)
        .maybeSingle(),
      (supabase as any)
        .schema('judiciario')
        .from('processos')
        .select('id, numero_cnj, tribunal, classe, status, data_ultima_movimentacao')
        .eq('user_id', user.id)
        .order('data_ultima_movimentacao', { ascending: false })
        .limit(10),
      (supabase as any)
        .schema('judiciario')
        .from('prazos')
        .select('id, descricao, data_prazo, tipo, urgente, cumprido')
        .eq('user_id', user.id)
        .gte('data_prazo', new Date().toISOString().split('T')[0])
        .order('data_prazo', { ascending: true })
        .limit(10),
    ]);

  return (
    <MeuCasoHub
      caso={caso}
      documentos={documentos ?? []}
      plano={plano}
      processos={processos ?? []}
      prazos={prazos ?? []}
    />
  );
}
