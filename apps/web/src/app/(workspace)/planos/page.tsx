import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import PlanosClient from '@/components/planos/PlanosClient';

export const metadata: Metadata = { title: 'Plano de Pagamento' };

export interface PlanoPagamento {
  id: string;
  user_id: string;
  caso_id: string | null;
  titulo: string;
  status: string;
  valor_total: number;
  parcela_sugerida: number;
  prazo_meses: number;
  cronograma: unknown;
  observacao: string | null;
  created_at: string;
  updated_at: string;
}

export default async function PlanosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: adminData } = await supabase
    .from('admin_users')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  const isAdmin = !!adminData;

  const { data: planos } = await supabase
    .from('portal_planos_pagamento')
    .select('id, user_id, caso_id, titulo, status, valor_total, parcela_sugerida, prazo_meses, cronograma, observacao, created_at, updated_at')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(100);

  return <PlanosClient initial={(planos ?? []) as PlanoPagamento[]} isAdmin={isAdmin} userId={user.id} />;
}
