import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
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
    const [{ data: dividas }, { data: casos }] = await Promise.all([
      supabase
        .from('portal_dividas')
        .select('id, user_id, credor, tipo, valor, situacao, negativado, numero_contrato, data_vencimento')
        .order('data_vencimento', { ascending: true })
        .limit(200),
      supabase
        .from('portal_casos')
        .select('user_id, full_name, fase'),
    ]);

    const clienteMap: Record<string, { nome: string; fase: string }> = {};
    for (const c of casos ?? []) {
      if (c.user_id) clienteMap[c.user_id] = { nome: c.full_name ?? '—', fase: c.fase ?? 'cadastro' };
    }

    return (
      <div className="space-y-4">
        <h1 className="text-lg font-semibold">Dívidas</h1>
        <DividasList dividas={dividas ?? []} clienteMap={clienteMap} isAdmin />
      </div>
    );
  }

  const { data: dividas } = await supabase
    .from('portal_dividas')
    .select('id, user_id, credor, tipo, valor, situacao, negativado, numero_contrato, data_vencimento')
    .eq('user_id', user?.id ?? '')
    .order('data_vencimento', { ascending: true });

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Minhas Dívidas</h1>
      <DividasList dividas={dividas ?? []} clienteMap={{}} isAdmin={false} />
    </div>
  );
}
