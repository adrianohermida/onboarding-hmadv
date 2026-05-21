import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import DocumentosList from '@/components/documentos/DocumentosList';

export const metadata: Metadata = { title: 'Documentos' };

interface SearchParams { status?: string; page?: string }

export default async function DocumentosPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient();
  const [{ data: { user } }, { data: adminData }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('admin_users').select('role').maybeSingle(),
  ]);

  const isAdmin = !!adminData;
  const page = Math.max(1, Number(searchParams.page ?? 1));
  const limit = 25;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('portal_documentos')
    .select('id, tipo, nome, workflow_status, direction, user_id, created_at, updated_at')
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (!isAdmin) query = query.eq('user_id', user?.id ?? '');
  if (searchParams.status) query = query.eq('workflow_status', searchParams.status);

  const { data: docs } = await query;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Documentos</h1>
        <p className="text-sm text-muted-foreground">{docs?.length ?? 0} documentos</p>
      </div>
      <DocumentosList docs={docs ?? []} isAdmin={isAdmin} status={searchParams.status} page={page} />
    </div>
  );
}
