import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AudienciasClient from '@/components/audiencias/AudienciasClient';
import type { Audiencia } from '@/lib/hooks/use-processos';

export const metadata: Metadata = { title: 'Audiências' };

export default async function AudienciasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: adminData } = await supabase
    .from('admin_users')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!adminData) redirect('/dashboard');

  const hoje = new Date().toISOString();

  const { data: audiencias } = await (supabase as any)
    .schema('judiciario')
    .from('audiencias')
    .select('id, processo_id, tipo, data_audiencia, descricao, local, situacao, link_videoconferencia, observacoes, created_at')
    .order('data_audiencia', { ascending: true })
    .limit(200);

  return <AudienciasClient initial={(audiencias ?? []) as Audiencia[]} />;
}
