'use client';

import Link from 'next/link';
import { Users, FileText, Clock, CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { ClienteSummary } from '@/types';
import { WORKFLOW_STATUS_LABELS, FASE_LABELS } from '@/types';
import StatusBadge from '../ui/StatusBadge';

interface Props {
  clients: ClienteSummary[];
  pendingDocs: Array<{ id: string; tipo: string; workflow_status: string; created_at: string; user_id: string }>;
}

export default function AdminDashboard({ clients, pendingDocs }: Props) {
  const stats = [
    { label: 'Clientes', value: clients.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Docs pendentes', value: pendingDocs.length, icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Onboarding concluído', value: clients.filter((c) => c.onboarding_done).length, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Em análise', value: clients.filter((c) => c.fase === 'analise').length, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-card border border-border rounded-xl p-4">
            <div className={`inline-flex p-2 rounded-lg ${stat.bg} mb-3`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent clients */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold">Clientes recentes</h2>
            <Link href="/clientes" className="text-xs text-primary hover:underline">Ver todos →</Link>
          </div>
          <div className="divide-y divide-border">
            {clients.slice(0, 5).map((c) => (
              <Link
                key={c.user_id}
                href={`/clientes/${c.user_id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
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
              <p className="px-4 py-6 text-sm text-muted-foreground text-center">Nenhum cliente ainda</p>
            )}
          </div>
        </div>

        {/* Pending documents */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold">Documentos em análise</h2>
            <Link href="/documentos" className="text-xs text-primary hover:underline">Ver todos →</Link>
          </div>
          <div className="divide-y divide-border">
            {pendingDocs.map((doc) => (
              <Link
                key={doc.id}
                href={`/documentos/${doc.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <FileText className="h-4 w-4 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{doc.tipo}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(doc.created_at)}</p>
                </div>
                <Clock className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
              </Link>
            ))}
            {pendingDocs.length === 0 && (
              <p className="px-4 py-6 text-sm text-muted-foreground text-center">Nenhum documento pendente</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
