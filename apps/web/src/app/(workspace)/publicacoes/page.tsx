import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import PublicacoesClient from '@/components/publicacoes/PublicacoesClient';
import type { Publicacao } from '@/components/publicacoes/types';

export const metadata = {
  title: 'Publicações Jurídicas — Hermida Maia',
};

export default async function PublicacoesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: adminData } = await supabase
    .from('admin_users')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  // Initial server-side fetch: caixa de entrada (unread, active)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: publicacoes } = await (supabase as any)
    .schema('judiciario')
    .from('publicacoes')
    .select(`
      id, processo_id, data_publicacao, conteudo, tem_prazo, prazo_data,
      lido, ativo, nome_cliente, nome_diario, cidade_comarca_descricao,
      vara_descricao, numero_processo_api, adriano_polo, data_hora_cadastro,
      ai_resumo, ai_tipo_ato, ai_prazo_sugerido, ai_urgencia, ai_enriquecido_at,
      processos:processo_id (
        id, numero_cnj, tribunal, comarca, status, classe, orgao_julgador
      ),
      prazo_calculado (
        id, data_vencimento, status, prioridade
      )
    `)
    .eq('ativo', true)
    .eq('lido', false)
    .order('data_publicacao', { ascending: false })
    .limit(30);

  return (
    <PublicacoesClient
      initialData={(publicacoes ?? []) as Publicacao[]}
      isAdmin={!!adminData}
    />
  );
}
