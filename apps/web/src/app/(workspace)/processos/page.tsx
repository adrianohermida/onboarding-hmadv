import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ProcessosClient from '@/components/processos/ProcessosClient';
import type { Processo } from '@/lib/hooks/use-processos';

export const metadata: Metadata = { title: 'Processos' };

export default async function ProcessosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: adminData } = await supabase
    .from('admin_users')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!adminData) redirect('/dashboard');

  const { data: processos } = await (supabase as any)
    .schema('judiciario')
    .from('processos')
    .select('id, numero_cnj, tribunal, comarca, ramo, orgao_julgador, classe, assunto, status, prioridade, valor_causa, segredo_justica, monitoramento_ativo, data_ajuizamento, data_ultima_movimentacao, created_at, updated_at')
    .order('data_ultima_movimentacao', { ascending: false })
    .limit(200);

  return <ProcessosClient initial={(processos ?? []) as Processo[]} isAdmin={true} />;
}
