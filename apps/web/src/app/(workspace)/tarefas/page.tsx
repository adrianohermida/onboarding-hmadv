import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import TarefasClient from '@/components/tarefas/TarefasClient';

export default async function TarefasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: adminData }, { data: tarefas }] = await Promise.all([
    supabase.from('admin_users').select('role').eq('user_id', user.id).maybeSingle(),
    supabase
      .from('re_tarefas')
      .select('id, titulo, descricao, status, prioridade, caso_id, responsavel_id, data_vencimento, criado_em, casos(nome_cliente)')
      .order('data_vencimento', { ascending: true })
      .limit(100),
  ]);

  const isAdmin = !!adminData;
  if (!isAdmin) redirect('/dashboard');

  return <TarefasClient tarefas={tarefas ?? []} userId={user.id} />;
}
