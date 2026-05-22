import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AtendimentoHub from '@/components/atendimento/AtendimentoHub';

export const metadata: Metadata = { title: 'Atendimento' };

export default async function AtendimentoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const hoje = new Date().toISOString().split('T')[0];
  const fim = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [{ data: mensagens }, { data: agendamentos }, { data: slots }] = await Promise.all([
    supabase
      .from('re_mensagens')
      .select('id, caso_id, remetente_id, conteudo, lida, criado_em, casos(nome_cliente)')
      .order('criado_em', { ascending: false })
      .limit(50),
    supabase
      .from('re_agendamentos')
      .select('id, slot_id, status, nome_cliente, email_cliente, tipo_atendimento, criado_em')
      .eq('email_cliente', user.email ?? '')
      .order('criado_em', { ascending: false })
      .limit(10),
    supabase
      .from('re_agenda_slots')
      .select('id, data, hora, disponivel, tipo')
      .gte('data', hoje)
      .lte('data', fim)
      .eq('disponivel', true)
      .order('data', { ascending: true })
      .order('hora', { ascending: true })
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
