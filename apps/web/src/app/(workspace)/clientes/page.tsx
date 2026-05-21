import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ClientesList from '@/components/clientes/ClientesList';

export const metadata: Metadata = { title: 'Clientes' };

interface SearchParams { search?: string; fase?: string; page?: string }

export default async function ClientesPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient();
  const [{ data: { user } }, { data: adminData }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('admin_users').select('role').maybeSingle(),
  ]);

  if (!adminData) redirect('/dashboard');

  const page = Math.max(1, Number(searchParams.page ?? 1));
  const limit = 20;
  const offset = (page - 1) * limit;

  const { data: clients } = await supabase.rpc('admin_get_clients', {
    p_search: searchParams.search,
    p_limit: limit,
    p_offset: offset,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Clientes</h1>
          <p className="text-sm text-muted-foreground">{clients?.length ?? 0} clientes encontrados</p>
        </div>
        <Link
          href="/clientes/novo"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Novo cliente
        </Link>
      </div>

      <ClientesList
        clients={clients ?? []}
        search={searchParams.search}
        fase={searchParams.fase}
        page={page}
      />
    </div>
  );
}
