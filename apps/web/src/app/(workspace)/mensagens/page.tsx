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

  const { data: workspaceMember } = await supabase
    .from('portal_workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();

  return (
    <MensagensClient
      isAdmin={!!adminData}
      currentUserId={user.id}
      tenantId={workspaceMember?.workspace_id ?? null}
    />
  );
}
