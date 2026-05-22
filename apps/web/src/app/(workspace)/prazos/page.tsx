import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import PrazosClient from '@/components/prazos/PrazosClient';
import type { PrazoCalculado } from '@/lib/hooks/use-processos';

export const metadata: Metadata = { title: 'Prazos' };

export default async function PrazosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: adminData } = await supabase
    .from('admin_users')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!adminData) redirect('/dashboard');

  const { data: prazos } = await (supabase as any)
    .schema('judiciario')
    .from('prazo_calculado')
    .select('id, processo_id, publicacao_id, titulo, descricao, data_vencimento, status, prioridade, base_legal, created_at')
    .order('data_vencimento', { ascending: true })
    .limit(500);

  return <PrazosClient initial={(prazos ?? []) as PrazoCalculado[]} />;
}
