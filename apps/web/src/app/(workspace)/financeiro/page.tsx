import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import FinanceiroClient from '@/components/financeiro/FinanceiroClient';

export const metadata: Metadata = { title: 'Financeiro' };

export default async function FinanceiroPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: adminData } = await supabase.from('admin_users').select('role').eq('user_id', user.id).maybeSingle();
  if (!adminData) redirect('/dashboard');

  const [
    { data: planos },
    { data: custas },
    { data: contratos },
    { data: casos },
  ] = await Promise.all([
    supabase
      .from('portal_planos_pagamento')
      .select('id, user_id, titulo, status, valor_total, parcela_sugerida, prazo_meses, created_at')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('portal_custas')
      .select('id, user_id, titulo, categoria, status, valor, data_vencimento, created_at')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('portal_contratos')
      .select('id, user_id, titulo, tipo, status, assinatura_status, assinado_em, arquivo_url, created_at')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('portal_casos')
      .select('user_id, nome_cliente')
      .limit(200),
  ]);

  const clienteMap: Record<string, string> = {};
  for (const c of casos ?? []) {
    if (c.user_id && c.nome_cliente) clienteMap[c.user_id] = c.nome_cliente;
  }

  return (
    <FinanceiroClient
      planos={planos ?? []}
      custas={custas ?? []}
      contratos={contratos ?? []}
      clienteMap={clienteMap}
    />
  );
}
