import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ContratosClient from '@/components/contratos/ContratosClient';

export const metadata: Metadata = { title: 'Contratos' };

export default async function ContratosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: adminData } = await supabase
    .from('admin_users')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  return <ContratosClient isAdmin={!!adminData} userId={user.id} />;
}
