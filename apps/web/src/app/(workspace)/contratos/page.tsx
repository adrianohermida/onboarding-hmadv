import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ContratosClient from '@/components/contratos/ContratosClient';

export const metadata: Metadata = { title: 'Contratos' };

export interface Contrato {
  id: string;
  user_id: string;
  caso_id: string | null;
  titulo: string;
  tipo: string | null;
  status: string;
  assinatura_status: string | null;
  assinado_em: string | null;
  arquivo_url: string | null;
  created_at: string;
  updated_at: string;
}

export default async function ContratosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: adminData } = await supabase
    .from('admin_users')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  const isAdmin = !!adminData;

  const { data: contratos } = await supabase
    .from('portal_contratos')
    .select('id, user_id, caso_id, titulo, tipo, status, assinatura_status, assinado_em, arquivo_url, created_at, updated_at')
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .limit(100);

  return <ContratosClient initial={(contratos ?? []) as Contrato[]} isAdmin={isAdmin} userId={user.id} />;
}
