import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import MensagensClient from '@/components/mensagens/MensagensClient';

export default async function MensagensPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: adminData }, { data: mensagens }] = await Promise.all([
    supabase.from('admin_users').select('role').eq('user_id', user.id).maybeSingle(),
    supabase
      .from('re_mensagens')
      .select('id, caso_id, remetente_id, conteudo, lida, criado_em, casos(nome_cliente)')
      .order('criado_em', { ascending: false })
      .limit(100),
  ]);

  const isAdmin = !!adminData;

  return <MensagensClient mensagens={mensagens ?? []} isAdmin={isAdmin} currentUserId={user.id} />;
}
