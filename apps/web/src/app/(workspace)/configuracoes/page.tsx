import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import ConfiguracoesClient from '@/components/configuracoes/ConfiguracoesClient';

export const metadata: Metadata = { title: 'Configurações' };

export default async function ConfiguracoesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: adminData } = await supabase.from('admin_users').select('role').maybeSingle();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Configurações</h1>
        <p className="text-sm text-muted-foreground">{user?.email}</p>
      </div>
      <ConfiguracoesClient
        userId={user?.id ?? ''}
        email={user?.email ?? ''}
        isAdmin={!!adminData}
        adminRole={adminData?.role ?? null}
      />
    </div>
  );
}
