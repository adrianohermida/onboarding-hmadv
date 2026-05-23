import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import TimelineJuridica from '@/components/timeline/TimelineJuridica';
import type { EventoTimeline } from '@/components/timeline/TimelineJuridica';

export const metadata: Metadata = { title: 'Timeline Jurídica' };

export default async function TimelinePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: adminData } = await supabase.from('admin_users').select('role').eq('user_id', user.id).maybeSingle();
  if (!adminData) redirect('/dashboard');

  const desde = new Date();
  desde.setDate(desde.getDate() - 60);
  const ate = new Date();
  ate.setDate(ate.getDate() + 30);
  const desdeISO = desde.toISOString();
  const ateISO = ate.toISOString();

  const [tarefasR, prazosR, audienciasR, publicacoesR] = await Promise.all([
    supabase
      .from('re_tasks')
      .select('id, title, description, status, due_date, created_at, portal_casos!portal_caso_id(full_name)')
      .gte('due_date', desdeISO)
      .lte('due_date', ateISO)
      .order('due_date', { ascending: false })
      .limit(50),
    (supabase as any)
      .schema('judiciario')
      .from('prazo_calculado')
      .select('id, titulo, status, prioridade, data_vencimento, processos(numero_cnj)')
      .gte('data_vencimento', desdeISO)
      .lte('data_vencimento', ateISO)
      .order('data_vencimento', { ascending: false })
      .limit(50),
    (supabase as any)
      .schema('judiciario')
      .from('audiencias')
      .select('id, tipo, situacao, data_audiencia, local, processos(numero_cnj)')
      .gte('data_audiencia', desdeISO)
      .lte('data_audiencia', ateISO)
      .order('data_audiencia', { ascending: false })
      .limit(50),
    (supabase as any)
      .schema('judiciario')
      .from('publicacoes')
      .select('id, conteudo, ai_urgencia, ai_tipo_ato, data_publicacao, nome_cliente, processos(numero_cnj)')
      .eq('ativo', true)
      .gte('data_publicacao', desdeISO)
      .order('data_publicacao', { ascending: false })
      .limit(30),
  ]);

  const eventos: EventoTimeline[] = [];

  for (const t of tarefasR.data ?? []) {
    eventos.push({
      id: `tarefa-${t.id}`,
      tipo: 'tarefa',
      titulo: t.title,
      descricao: t.description,
      data: t.due_date ?? t.created_at,
      urgencia: null,
      status: t.status,
      cliente: (t.portal_casos as any)?.full_name ?? null,
    });
  }

  for (const p of prazosR.data ?? []) {
    eventos.push({
      id: `prazo-${p.id}`,
      tipo: 'prazo',
      titulo: p.titulo ?? 'Prazo',
      data: p.data_vencimento,
      urgencia: p.prioridade,
      status: p.status,
      processo: (p.processos as any)?.numero_cnj ?? null,
    });
  }

  for (const a of audienciasR.data ?? []) {
    eventos.push({
      id: `audiencia-${a.id}`,
      tipo: 'audiencia',
      titulo: a.tipo ?? 'Audiência',
      descricao: a.local,
      data: a.data_audiencia,
      status: a.situacao,
      processo: (a.processos as any)?.numero_cnj ?? null,
    });
  }

  for (const pub of publicacoesR.data ?? []) {
    eventos.push({
      id: `publicacao-${pub.id}`,
      tipo: 'publicacao',
      titulo: pub.ai_tipo_ato ?? 'Publicação',
      descricao: pub.conteudo?.slice(0, 120),
      data: pub.data_publicacao,
      urgencia: pub.ai_urgencia,
      cliente: pub.nome_cliente,
      processo: (pub.processos as any)?.numero_cnj ?? null,
    });
  }

  const sorted = eventos.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

  return <TimelineJuridica initialEventos={sorted} />;
}
