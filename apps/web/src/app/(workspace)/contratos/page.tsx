import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ContratosClient from '@/components/contratos/ContratosClient';

export const metadata: Metadata = { title: 'Contratos' };

export default async function ContratosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: adminData } = await supabase
    .from('admin_users')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  const isAdmin = !!adminData;

  let query = supabase
    .from('portal_documentos')
    .select('id, tipo, nome, url, workflow_status, direction, mime_type, file_size, created_at, updated_at, user_id, admin_notes')
    .in('tipo', ['contrato', 'procuracao', 'acordo', 'termo_compromisso', 'contrato_honorarios'])
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .limit(100);

  if (!isAdmin) query = query.eq('user_id', user.id);

  const { data: contratos } = await query;

  return <ContratosClient contratos={contratos ?? []} isAdmin={isAdmin} />;
}
