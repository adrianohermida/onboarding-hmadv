import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ClienteDetail from '@/components/clientes/ClienteDetail';

export const metadata: Metadata = { title: 'Cliente' };

export default async function ClienteDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: adminData } = await supabase.from('admin_users').select('role').maybeSingle();
  if (!adminData) redirect('/dashboard');

  const [{ data: caso }, { data: docs }, { data: timeline }] = await Promise.all([
    supabase
      .from('portal_casos')
      .select('*')
      .eq('user_id', params.id)
      .maybeSingle(),
    supabase
      .from('portal_documentos')
      .select('id, tipo, nome, workflow_status, direction, require_signature, created_at, updated_at')
      .eq('user_id', params.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('portal_timeline')
      .select('id, event_type, title, description, created_at, metadata')
      .eq('user_id', params.id)
      .order('created_at', { ascending: false })
      .limit(30),
  ]);

  if (!caso) notFound();

  return <ClienteDetail caso={caso} docs={docs ?? []} timeline={timeline ?? []} />;
}
