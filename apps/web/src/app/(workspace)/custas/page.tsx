import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import CustasClient from '@/components/custas/CustasClient';

export const metadata: Metadata = { title: 'Custas' };

export default async function CustasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: adminData } = await supabase
    .from('admin_users')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  const isAdmin = !!adminData;

  // Comprovantes de pagamento — documentos do tipo custas/guia
  let docsQuery = supabase
    .from('portal_documentos')
    .select('id, tipo, nome, url, workflow_status, mime_type, file_size, created_at, updated_at, user_id, admin_notes')
    .in('tipo', ['comprovante_pagamento', 'guia_judicial', 'taxa', 'custas', 'comprovante_custas'])
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(100);

  if (!isAdmin) docsQuery = docsQuery.eq('user_id', user.id);

  // Dados financeiros (valor_custas por caso)
  let finQuery = supabase
    .from('re_dados_financeiros')
    .select('id, caso_id, valor_custas, casos(nome_cliente, user_id)');

  const [{ data: comprovantes }, { data: dadosFinanceiros }] = await Promise.all([
    docsQuery,
    isAdmin ? finQuery.limit(50) : finQuery.eq('casos.user_id', user.id).limit(10),
  ]);

  return (
    <CustasClient
      comprovantes={comprovantes ?? []}
      dadosFinanceiros={dadosFinanceiros ?? []}
      isAdmin={isAdmin}
      userId={user.id}
    />
  );
}
