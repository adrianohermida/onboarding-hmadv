import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DocumentoDetail from '@/components/documentos/DocumentoDetail';

export const metadata: Metadata = { title: 'Documento' };

export default async function DocumentoDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const [{ data: { user } }, { data: adminData }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('admin_users').select('role').maybeSingle(),
  ]);

  let query = supabase
    .from('portal_documentos')
    .select('*')
    .eq('id', params.id)
    .is('deleted_at', null);

  if (!adminData) query = query.eq('user_id', user?.id ?? '');

  const { data: doc } = await query.maybeSingle();
  if (!doc) notFound();

  return <DocumentoDetail doc={doc} isAdmin={!!adminData} />;
}
