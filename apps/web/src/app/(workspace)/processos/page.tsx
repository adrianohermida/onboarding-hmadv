import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ProcessosClient from '@/components/processos/ProcessosClient';

export default async function ProcessosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: adminData }, { data: processos }] = await Promise.all([
    supabase.from('admin_users').select('role').eq('user_id', user.id).maybeSingle(),
    supabase
      .from('re_processos_judiciais')
      .select('id, caso_id, numero_cnj, tribunal, grau, classe_nome, assunto_principal, orgao_julgador, data_distribuicao, ultima_movimentacao, valor_causa, sincronizado_em, casos(nome_cliente)')
      .order('sincronizado_em', { ascending: false })
      .limit(100),
  ]);

  const isAdmin = !!adminData;

  return <ProcessosClient processos={processos ?? []} isAdmin={isAdmin} />;
}
