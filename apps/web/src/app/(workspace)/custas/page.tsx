import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import CustasClient from '@/components/custas/CustasClient';

export const metadata: Metadata = { title: 'Custas' };

export default async function CustasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: adminData } = await supabase
    .from('admin_users')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  return <CustasClient isAdmin={!!adminData} userId={user.id} />;
}
