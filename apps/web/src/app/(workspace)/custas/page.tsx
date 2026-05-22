import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import CustasClient from '@/components/custas/CustasClient';

export const metadata: Metadata = { title: 'Custas' };

export interface Custa {
  id: string;
  user_id: string;
  caso_id: string | null;
  titulo: string | null;
  descricao: string | null;
  categoria: string;
  status: string;
  valor: number;
  data_lancamento: string;
  data_vencimento: string | null;
  comprovante_url: string | null;
  comprovante_nome: string | null;
  created_at: string;
}

export default async function CustasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: adminData } = await supabase
    .from('admin_users')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  const isAdmin = !!adminData;

  const { data: custas } = await supabase
    .from('portal_custas')
    .select('id, user_id, caso_id, titulo, descricao, categoria, status, valor, data_lancamento, data_vencimento, comprovante_url, comprovante_nome, created_at')
    .is('deleted_at', null)
    .order('data_lancamento', { ascending: false })
    .limit(200);

  return <CustasClient initial={(custas ?? []) as Custa[]} isAdmin={isAdmin} userId={user.id} />;
}
