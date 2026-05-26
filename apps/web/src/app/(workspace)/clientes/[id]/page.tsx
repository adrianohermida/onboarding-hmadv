import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ClienteDetail from '@/components/clientes/ClienteDetail';

export const metadata: Metadata = { title: 'Cliente' };

export default async function ClienteDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: adminData } = await supabase.from('admin_users').select('role').maybeSingle();
  if (!adminData) redirect('/dashboard');

  const { data: caso } = await supabase
    .from('portal_casos')
    .select('*')
    .eq('user_id', params.id)
    .maybeSingle();

  if (!caso) notFound();

  const [
    { data: docs },
    { data: timeline },
    { data: tarefas },
    { data: custas },
    { data: contratos },
    { data: planos },
  ] = await Promise.all([
    supabase
      .from('portal_documentos')
      .select('id, tipo, nome_arquivo, workflow_status, direction, require_signature, created_at, updated_at')
      .eq('user_id', params.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('portal_cnj_timeline')
      .select('id, evento_tipo, descricao, payload, created_at')
      .eq('caso_id', caso.id)
      .order('created_at', { ascending: false })
      .limit(30),
    supabase
      .from('re_tasks')
      .select('id, title, status, due_date, created_at')
      .eq('portal_caso_id', caso.id)
      .order('due_date', { ascending: true })
      .limit(20),
    supabase
      .from('portal_custas')
      .select('id, titulo, categoria, status, valor, data_vencimento, created_at')
      .eq('user_id', params.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('portal_contratos')
      .select('id, titulo, tipo, status, assinatura_status, assinado_em, arquivo_url, created_at')
      .eq('user_id', params.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('portal_planos_pagamento')
      .select('id, titulo, status, valor_total, parcela_sugerida, prazo_meses, cronograma, created_at')
      .eq('user_id', params.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  return (
    <ClienteDetail
      caso={caso}
      docs={docs ?? []}
      timeline={timeline ?? []}
      tarefas={tarefas ?? []}
      custas={custas ?? []}
      contratos={contratos ?? []}
      planos={planos ?? []}
    />
  );
}
