import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DividasList from '@/components/dividas/DividasList';

export const metadata: Metadata = { title: 'Dívidas' };

export default async function DiviasPage() {
  const supabase = await createClient();
  const [{ data: { user } }, { data: adminData }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('admin_users').select('role').maybeSingle(),
  ]);

  const isAdmin = !!adminData;

  if (isAdmin) {
    // Admin: list all cases with dividas populated
    const { data: casos } = await supabase
      .from('portal_casos')
      .select('id, user_id, nome, dividas, fase, created_at')
      .not('dividas', 'eq', '[]')
      .not('dividas', 'is', null)
      .order('created_at', { ascending: false })
      .limit(50);

    return (
      <div className="space-y-4">
        <h1 className="text-lg font-semibold">Dívidas</h1>
        <DividasList casos={casos ?? []} isAdmin />
      </div>
    );
  }

  // Cliente: their own case
  const { data: caso } = await supabase
    .from('portal_casos')
    .select('id, user_id, nome, dividas, fase, created_at')
    .eq('user_id', user?.id ?? '')
    .maybeSingle();

  if (!caso) redirect('/dashboard');

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Minhas Dívidas</h1>
      <DividasList casos={[caso]} isAdmin={false} />
    </div>
  );
}
