import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import MensagensClient from '@/components/mensagens/MensagensClient';

export default async function MensagensPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: adminData } = await supabase
    .from('admin_users')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  return <MensagensClient isAdmin={!!adminData} currentUserId={user.id} />;
}
