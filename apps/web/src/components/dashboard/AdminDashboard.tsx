'use client';

import Link from 'next/link';
import {
  Users, FileText, Clock, CheckCircle2, Gavel, CheckSquare,
  Newspaper, ArrowRight, Calendar, AlertTriangle,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { formatDate } from '@/lib/utils';
import type { ClienteSummary } from '@/types';
import { FASE_LABELS } from '@/types';
import StatusBadge from '../ui/StatusBadge';
import { cn } from '@/lib/utils';

interface Props {
  clients: ClienteSummary[];
  pendingDocs: Array<{ id: string; tipo: string; workflow_status: string; created_at: string; user_id: string }>;
}

function useAdminCounts() {
  return useQuery({
    queryKey: ['admin-dashboard-counts'],
    staleTime: 60_000,
    queryFn: async () => {
      const supabase = createClient();
      const hoje = new Date().toISOString().split('T')[0];
      const semana = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const [
        tarefasResult,
        processosResult,
        publicacoesResult,
        prazosResult,
        audienciasResult,
      ] = await Promise.all([
        supabase.from('re_tasks').select('id', { count: 'exact', head: true }).not('status', 'in', '("done","cancelled","concluida","cancelada")'),
        (supabase as any).schema('judiciario').from('processos').select('id', { count: 'exact', head: true }),
        (supabase as any)
          .schema('judiciario')
          .from('publicacoes')
          .select('id', { count: 'exact', head: true })
          .eq('lido', false)
          .eq('ativo', true)
          .catch(() => ({ count: 0 })),
        (supabase as any)
          .schema('judiciario')
          .from('prazo_calculado')
          .select('id', { count: 'exact', head: true })
          .lte('data_vencimento', semana)
          .eq('concluido', false)
          .catch(() => ({ count: 0 })),
        (supabase as any)
          .schema('judiciario')
          .from('audiencias')
          .select('id', { count: 'exact', head: true })
          .gte('data_audiencia', hoje)
          .lte('data_audiencia', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())
          .neq('situacao', 'cancelada')
          .catch(() => ({ count: 0 })),
      ]);

      return {
        tarefas: tarefasResult.count ?? 0,
        processos: processosResult.count ?? 0,
        publicacoes: publicacoesResult.count ?? 0,
        prazos: prazosResult.count ?? 0,
        audiencias: audienciasResult.count ?? 0,
      };
    },
  });
}

function KpiSkeleton() {
  return <div className="h-7 w-12 rounded bg-muted animate-pulse" />;
}

export default function AdminDashboard({ clients, pendingDocs }: Props) {
  const { data: counts } = useAdminCounts();

  const kpis = [
    {
      label: 'Clientes ativos',
      value: clients.length,
      Icon: Users,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      href: '/clientes',
    },
    {
      label: 'Processos',
      value: counts?.processos,
      Icon: Gavel,
      color: 'text-violet-500',
      bg: 'bg-violet-500/10',
      href: '/processos',
    },
    {
      label: 'Publicações novas',
      value: counts?.publicacoes,
      Icon: Newspaper,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      href: '/publicacoes',
    },
    {
      label: 'Prazos esta semana',
      value: counts?.prazos,
      Icon: AlertTriangle,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
      href: '/prazos',
      urgent: counts != null && (counts.prazos ?? 0) > 0,
    },
    {
      label: 'Audiências (7 dias)',
      value: counts?.audiencias,
      Icon: Calendar,
      color: 'text-indigo-500',
      bg: 'bg-indigo-500/10',
      href: '/audiencias',
    },
    {
      label: 'Tarefas pendentes',
      value: counts?.tarefas,
      Icon: CheckSquare,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
      href: '/tarefas',
    },
    {
      label: 'Docs em análise',
      value: pendingDocs.length,
      Icon: FileText,
      color: 'text-rose-500',
      bg: 'bg-rose-500/10',
      href: '/documentos',
      urgent: pendingDocs.length > 0,
    },
    {
      label: 'Onboarding concluído',
      value: clients.filter((c) => c.onboarding_done).length,
      Icon: CheckCircle2,
      color: 'text-teal-500',
      bg: 'bg-teal-500/10',
      href: '/clientes',
    },
  ];

  return (
    <div className="space-y-4 p-3 sm:p-4 lg:p-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {kpis.map((kpi) => (
          <Link
            key={kpi.label}
            href={kpi.href}
            className={cn(
              'bg-card border rounded-lg p-3 hover:border-primary/40 hover:bg-muted/30 transition-colors group',
              kpi.urgent ? 'border-orange-300 bg-orange-50/30' : 'border-border',
            )}
          >
            <div className={cn('inline-flex p-1.5 rounded-md mb-2', kpi.bg)}>
              <kpi.Icon className={cn('h-4 w-4', kpi.color)} />
            </div>
            <p className="text-xl font-bold text-foreground tabular-nums leading-none">
              {kpi.value == null ? <KpiSkeleton /> : kpi.value}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{kpi.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold">Clientes recentes</h2>
            <Link href="/clientes" className="flex items-center gap-1 text-xs text-primary hover:underline">
              Ver todos <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {clients.slice(0, 6).map((c) => (
              <Link
                key={c.user_id}
                href={`/clientes/${c.user_id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0 uppercase">
                  {c.full_name?.split(' ').slice(0, 2).map((w: string) => w[0]).join('') || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{c.full_name || '—'}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(c.created_at)}</p>
                </div>
                <StatusBadge status={c.fase} labels={FASE_LABELS} />
              </Link>
            ))}
            {clients.length === 0 && (
              <p className="px-4 py-8 text-sm text-muted-foreground text-center">Nenhum cliente ainda</p>
            )}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold">Documentos em análise</h2>
            <Link href="/documentos" className="flex items-center gap-1 text-xs text-primary hover:underline">
              Ver todos <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {pendingDocs.map((doc) => (
              <Link
                key={doc.id}
                href={`/documentos/${doc.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="h-4 w-4 text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{doc.tipo}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(doc.created_at)}</p>
                </div>
                <Clock className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
              </Link>
            ))}
            {pendingDocs.length === 0 && (
              <div className="px-4 py-8 text-center">
                <CheckCircle2 className="h-6 w-6 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Sem documentos pendentes</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
