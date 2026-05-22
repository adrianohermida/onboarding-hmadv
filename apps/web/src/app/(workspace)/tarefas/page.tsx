import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import TarefasClient from '@/components/tarefas/TarefasClient';

export default async function TarefasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: adminData } = await supabase
    .from('admin_users')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!adminData) redirect('/dashboard');

  return <TarefasClient userId={user.id} />;
}
