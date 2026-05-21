import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import PlanosList from '@/components/planos/PlanosList';

export const metadata: Metadata = { title: 'Plano de Pagamento' };

export default async function PlanosPage() {
  const supabase = await createClient();
  const [{ data: { user } }, { data: adminData }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('admin_users').select('role').maybeSingle(),
  ]);

  const isAdmin = !!adminData;

  if (isAdmin) {
    const { data: casos } = await supabase
      .from('portal_casos')
      .select('id, user_id, nome, plano_pagamento, fase, created_at')
      .not('plano_pagamento', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(50);

    return (
      <div className="space-y-4">
        <h1 className="text-lg font-semibold">Planos de Pagamento</h1>
        <PlanosList casos={casos ?? []} isAdmin />
      </div>
    );
  }

  const { data: caso } = await supabase
    .from('portal_casos')
    .select('id, user_id, nome, plano_pagamento, fase, created_at')
    .eq('user_id', user?.id ?? '')
    .maybeSingle();

  if (!caso) redirect('/dashboard');

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Meu Plano de Pagamento</h1>
      <PlanosList casos={[caso]} isAdmin={false} />
    </div>
  );
}
