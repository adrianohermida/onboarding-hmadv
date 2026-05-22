import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import FinanceiroClient from '@/components/financeiro/FinanceiroClient';

export const metadata: Metadata = { title: 'Financeiro' };

export default async function FinanceiroPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: adminData } = await supabase
    .from('admin_users')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!adminData) redirect('/dashboard');

  return <FinanceiroClient />;
}
