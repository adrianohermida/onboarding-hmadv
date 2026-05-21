import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import ClienteDashboard from '@/components/dashboard/ClienteDashboard';

export const metadata: Metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const supabase = await createClient();

  const [{ data: { user } }, { data: adminData }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('admin_users').select('role').maybeSingle(),
  ]);

  const isAdmin = !!adminData;

  if (isAdmin) {
    const { data: clients } = await supabase.rpc('admin_get_clients', { p_limit: 10, p_offset: 0 });
    const { data: pendingDocs } = await supabase
      .from('portal_documentos')
      .select('id, tipo, workflow_status, created_at, user_id')
      .eq('workflow_status', 'em_analise')
      .order('created_at', { ascending: false })
      .limit(5);

    return <AdminDashboard clients={clients ?? []} pendingDocs={pendingDocs ?? []} />;
  }

  const { data: caso } = await supabase
    .from('portal_casos')
    .select('id, nome, fase, onboarding_done, cnj_step_atual, created_at')
    .eq('user_id', user?.id ?? '')
    .maybeSingle();

  const { data: docs } = await supabase
    .from('portal_documentos')
    .select('id, tipo, workflow_status, updated_at')
    .eq('user_id', user?.id ?? '')
    .order('updated_at', { ascending: false })
    .limit(5);

  return <ClienteDashboard caso={caso} docs={docs ?? []} />;
}
