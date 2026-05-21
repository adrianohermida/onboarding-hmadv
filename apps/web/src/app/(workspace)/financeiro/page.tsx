import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import FinanceiroClient from '@/components/financeiro/FinanceiroClient';

export default async function FinanceiroPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: adminData }, { data: planos }, { data: dividas }] = await Promise.all([
    supabase.from('admin_users').select('role').eq('user_id', user.id).maybeSingle(),
    supabase
      .from('re_planos_pagamento')
      .select('id, caso_id, status, valor_total, total_parcelas, parcelas_pagas, data_inicio, observacoes, casos(nome_cliente)')
      .order('data_inicio', { ascending: false })
      .limit(50),
    supabase
      .from('re_dados_financeiros')
      .select('id, caso_id, valor_divida_total, valor_honorarios, valor_custas, casos(nome_cliente)')
      .limit(50),
  ]);

  const isAdmin = !!adminData;
  if (!isAdmin) redirect('/dashboard');

  return <FinanceiroClient planos={planos ?? []} dividas={dividas ?? []} />;
}
