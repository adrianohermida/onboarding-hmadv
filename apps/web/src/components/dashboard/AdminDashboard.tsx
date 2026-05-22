'use client';

import Link from 'next/link';
import { Users, FileText, Clock, CheckCircle2, TrendingUp, Gavel, CheckSquare, Newspaper, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { formatDate } from '@/lib/utils';
import type { ClienteSummary } from '@/types';
import { FASE_LABELS } from '@/types';
import StatusBadge from '../ui/StatusBadge';

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
      const [
        { count: tarefas },
        { count: processos },
        { count: publicacoes },
      ] = await Promise.all([
        supabase.from('re_tarefas').select('id', { count: 'exact', head: true }).eq('status', 'pendente'),
        supabase.from('re_processos_judiciais').select('id', { count: 'exact', head: true }),
        (supabase as any).schema('judiciario')
          .from('publicacoes')
          .select('id', { count: 'exact', head: true })
          .eq('lido', false)
          .eq('ativo', true)
          .then((r: any) => r)
          .catch(() => ({ count: 0 })),
      ]);
      return {
        tarefas: tarefas ?? 0,
        processos: processos ?? 0,
        publicacoes: publicacoes ?? 0,
      };
    },
  });
}

function KpiSkeleton() {
  return <div className="h-5 w-10 rounded bg-muted animate-pulse" />;
}

export default function AdminDashboard({ clients, pendingDocs }: Props) {
  const { data: counts } = useAdminCounts();

  const kpis = [
    {
      label: 'Clientes ativos',
      value: clients.length,
      icon: Users,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      href: '/clientes',
    },
    {
      label: 'Processos',
      value: counts?.processos,
      icon: Gavel,
      color: 'text-violet-500',
      bg: 'bg-violet-500/10',
      href: '/processos',
    },
    {
      label: 'Publicações novas',
      value: counts?.publicacoes,
      icon: Newspaper,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      href: '/publicacoes',
    },
    {
      label: 'Tarefas pendentes',
      value: counts?.tarefas,
      icon: CheckSquare,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
      href: '/tarefas',
    },
    {
      label: 'Docs em análise',
      value: pendingDocs.length,
      icon: FileText,
      color: 'text-rose-500',
      bg: 'bg-rose-500/10',
      href: '/documentos',
    },
    {
      label: 'Onboarding concluído',
      value: clients.filter((c) => c.onboarding_done).length,
      icon: CheckCircle2,
      color: 'text-teal-500',
      bg: 'bg-teal-500/10',
      href: '/clientes',
    },
  ];

  return (
    <div className="space-y-6 p-4 lg:p-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map((kpi) => (
          <Link
            key={kpi.label}
            href={kpi.href}
            className="bg-card border border-border rounded-xl p-4 hover:border-primary/40 hover:bg-muted/30 transition-colors group"
          >
            <div className={`inline-flex p-2 rounded-lg ${kpi.bg} mb-3`}>
              <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
            </div>
            <p className="text-2xl font-bold text-foreground tabular-nums">
              {kpi.value == null ? <KpiSkeleton /> : kpi.value}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{kpi.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent clients */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
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
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0 uppercase">
                  {c.nome?.split(' ').slice(0, 2).map((w: string) => w[0]).join('') || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{c.nome || '—'}</p>
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

        {/* Pending documents */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
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
                <p className="text-sm text-muted-foreground">Nenhum documento pendente</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
