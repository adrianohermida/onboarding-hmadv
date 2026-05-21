import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AgendaClient from '@/components/agenda/AgendaClient';

export default async function AgendaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const hoje = new Date().toISOString().split('T')[0];
  const fim = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [{ data: slots }, { data: agendamentos }] = await Promise.all([
    supabase
      .from('re_agenda_slots')
      .select('id, data, hora, disponivel, tipo')
      .gte('data', hoje)
      .lte('data', fim)
      .order('data', { ascending: true })
      .order('hora', { ascending: true })
      .limit(200),
    supabase
      .from('re_agendamentos')
      .select('id, slot_id, status, nome_cliente, email_cliente, telefone_cliente, tipo_atendimento, observacoes, criado_em')
      .gte('criado_em', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('criado_em', { ascending: false })
      .limit(100),
  ]);

  return <AgendaClient slots={slots ?? []} agendamentos={agendamentos ?? []} />;
}
