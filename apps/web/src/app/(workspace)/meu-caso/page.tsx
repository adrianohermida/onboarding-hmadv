import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import MeuCasoHub from '@/components/meu-caso/MeuCasoHub';

export const metadata: Metadata = { title: 'Meu Caso' };

export default async function MeuCasoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: caso }, { data: documentos }, { data: processos }, { data: prazos }] =
    await Promise.all([
      supabase
        .from('portal_casos')
        .select('id, fase, cnj_step_atual, full_name, created_at')
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('portal_documentos')
        .select('id, nome_arquivo, workflow_status, tipo')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20),
      (supabase as any)
        .schema('judiciario')
        .from('processos')
        .select('id, numero_cnj, tribunal, classe, status, data_ultima_movimentacao')
        .order('data_ultima_movimentacao', { ascending: false })
        .limit(10),
      (supabase as any)
        .schema('judiciario')
        .from('prazo_calculado')
        .select('id, titulo, data_vencimento, concluido')
        .gte('data_vencimento', new Date().toISOString().split('T')[0])
        .eq('concluido', false)
        .order('data_vencimento', { ascending: true })
        .limit(10),
    ]);

  return (
    <MeuCasoHub
      caso={caso}
      documentos={documentos ?? []}
      plano={null}
      processos={processos ?? []}
      prazos={prazos ?? []}
    />
  );
}
