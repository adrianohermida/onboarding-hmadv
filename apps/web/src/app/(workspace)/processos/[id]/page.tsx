import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ProcessoWorkspace from '@/components/processos/ProcessoWorkspace';

export const metadata: Metadata = { title: 'Central do Processo' };

export default async function ProcessoPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: adminData } = await supabase
    .from('admin_users')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!adminData) redirect('/dashboard');

  const { data: processo } = await (supabase as any)
    .schema('judiciario')
    .from('processos')
    .select('id, numero_cnj, tribunal, comarca, ramo, orgao_julgador, classe, assunto, status, prioridade, valor_causa, segredo_justica, monitoramento_ativo, data_ajuizamento, data_ultima_movimentacao, created_at, updated_at')
    .eq('id', params.id)
    .single();

  if (!processo) redirect('/processos');

  // Busca partes para resolver user_ids dos clientes (aba Documentos)
  const { data: partes } = await (supabase as any)
    .schema('judiciario')
    .from('partes')
    .select('nome, documento, polo, cliente_hmadv, representada_pelo_escritorio')
    .eq('processo_id', params.id);

  const cpfs = ((partes ?? []) as any[])
    .filter((p: any) => p.cliente_hmadv && p.documento)
    .map((p: any) => (p.documento as string).replace(/\D/g, ''))
    .filter(Boolean);

  let clientUserIds: string[] = [];
  if (cpfs.length > 0) {
    const { data: casos } = await supabase
      .from('portal_casos')
      .select('user_id')
      .in('cpf', cpfs);
    clientUserIds = (casos ?? []).map((c: any) => c.user_id as string);
  }

  return (
    <ProcessoWorkspace
      processo={processo}
      initialPartes={partes ?? []}
      clientUserIds={clientUserIds}
    />
  );
}
