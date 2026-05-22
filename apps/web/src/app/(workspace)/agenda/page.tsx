import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AgendaClient from '@/components/agenda/AgendaClient';

export const metadata: Metadata = { title: 'Agenda' };

export default async function AgendaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: adminData } = await supabase
    .from('admin_users')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!adminData) redirect('/dashboard');

  const { data: agendamentos } = await supabase
    .from('agendamentos')
    .select('id, nome, email, telefone, area, data, hora, status, observacoes, zoom_join_url, created_at')
    .order('data', { ascending: true })
    .order('hora', { ascending: true })
    .limit(500);

  return (
    <AgendaClient agendamentos={agendamentos ?? []} isAdmin={true} />
  );
}
