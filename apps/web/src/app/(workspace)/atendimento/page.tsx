import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AtendimentoHub from '@/components/atendimento/AtendimentoHub';

export const metadata: Metadata = { title: 'Atendimento' };

export default async function AtendimentoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const agora = new Date().toISOString();
  const fim = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: mensagens }, { data: agendamentos }, { data: slots }] = await Promise.all([
    supabase
      .from('re_messages')
      .select('id, user_id, from_role, from_name, text, ts')
      .order('ts', { ascending: false })
      .limit(50),
    supabase
      .from('re_bookings')
      .select('id, slot_id, user_id, status, notes, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('re_agenda_slots')
      .select('id, starts_at, ends_at, title, duration_min, location')
      .gte('starts_at', agora)
      .lte('starts_at', fim)
      .order('starts_at', { ascending: true })
      .limit(30),
  ]);

  return (
    <AtendimentoHub
      mensagens={mensagens ?? []}
      agendamentos={agendamentos ?? []}
      slots={slots ?? []}
      userId={user.id}
    />
  );
}
