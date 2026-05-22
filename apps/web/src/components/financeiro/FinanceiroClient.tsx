'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import {
  DollarSign, TrendingUp, AlertCircle, CheckCircle2,
  Receipt, FileText, CreditCard, ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import EmptyState from '../ui/EmptyState';

interface PlanoPagamento {
  id: string;
  user_id: string;
  titulo: string | null;
  status: string | null;
  valor_total: number | null;
  parcela_sugerida: number | null;
  prazo_meses: number | null;
  created_at: string;
}

interface Custa {
  id: string;
  user_id: string;
  titulo: string | null;
  categoria: string | null;
  status: string | null;
  valor: number | null;
  data_vencimento: string | null;
  created_at: string;
}

interface Contrato {
  id: string;
  user_id: string;
  titulo: string | null;
  tipo: string | null;
  status: string | null;
  assinatura_status: string | null;
  assinado_em: string | null;
  arquivo_url: string | null;
  created_at: string;
}

interface Props {
  planos?: PlanoPagamento[];
  custas?: Custa[];
  contratos?: Contrato[];
  clienteMap?: Record<string, string>;
}

const PLANO_STATUS: Record<string, { label: string; cls: string }> = {
  ativo:     { label: 'Ativo',     cls: 'bg-green-50 text-green-700 border-green-200' },
  pausado:   { label: 'Pausado',   cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  concluido: { label: 'Concluído', cls: 'bg-teal-50 text-teal-700 border-teal-200' },
  cancelado: { label: 'Cancelado', cls: 'bg-red-50 text-red-700 border-red-200' },
};

const CUSTA_STATUS: Record<string, { label: string; cls: string }> = {
  pendente:  { label: 'Pendente',  cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  pago:      { label: 'Pago',      cls: 'bg-green-50 text-green-700 border-green-200' },
  vencido:   { label: 'Vencido',   cls: 'bg-red-50 text-red-700 border-red-200' },
  cancelado: { label: 'Cancelado', cls: 'bg-gray-100 text-gray-600 border-gray-200' },
};

const CONTRATO_STATUS: Record<string, { label: string; cls: string }> = {
  rascunho:  { label: 'Rascunho',  cls: 'bg-gray-100 text-gray-600 border-gray-200' },
  ativo:     { label: 'Ativo',     cls: 'bg-green-50 text-green-700 border-green-200' },
  assinado:  { label: 'Assinado',  cls: 'bg-teal-50 text-teal-700 border-teal-200' },
  encerrado: { label: 'Encerrado', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
};

const ASSINATURA_STATUS: Record<string, { label: string; cls: string }> = {
  pendente: { label: 'Assinatura pendente', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  assinado: { label: 'Assinado',            cls: 'bg-green-50 text-green-700 border-green-200' },
  recusado: { label: 'Recusado',            cls: 'bg-red-50 text-red-700 border-red-200' },
};

function useFinanceiro() {
  const supabase = createClient();

  const { data: planos = [] } = useQuery<PlanoPagamento[]>({
    queryKey: ['financeiro-planos'],
    staleTime: 30_000,
    queryFn: async () => {
      const { data } = await supabase
        .from('portal_planos_pagamento')
        .select('id, user_id, titulo, status, valor_total, parcela_sugerida, prazo_meses, created_at')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(500);
      return data ?? [];
    },
  });

  const { data: custas = [] } = useQuery<Custa[]>({
    queryKey: ['financeiro-custas'],
    staleTime: 30_000,
    queryFn: async () => {
      const { data } = await supabase
        .from('portal_custas')
        .select('id, user_id, titulo, categoria, status, valor, data_vencimento, created_at')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(500);
      return data ?? [];
    },
  });

  const { data: contratos = [] } = useQuery<Contrato[]>({
    queryKey: ['financeiro-contratos'],
    staleTime: 30_000,
    queryFn: async () => {
      const { data } = await supabase
        .from('portal_contratos')
        .select('id, user_id, titulo, tipo, status, assinatura_status, assinado_em, arquivo_url, created_at')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(500);
      return data ?? [];
    },
  });

  const { data: clienteMap = {} } = useQuery<Record<string, string>>({
    queryKey: ['financeiro-cliente-map'],
    staleTime: 120_000,
    queryFn: async () => {
      const map: Record<string, string> = {};
      const { data } = await supabase
        .from('portal_casos')
        .select('user_id, full_name')
        .limit(2000);
      for (const r of (data ?? [])) {
        if (r.user_id && r.full_name) map[r.user_id] = r.full_name;
      }
      return map;
    },
  });

  return { planos, custas, contratos, clienteMap };
}

function fmt(v: number | null | undefined) {
  if (v == null) return '—';
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function fmtData(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR');
}

function Badge({ status, config }: { status: string | null; config: Record<string, { label: string; cls: string }> }) {
  const cfg = config[status ?? ''] ?? { label: status ?? '—', cls: 'bg-gray-100 text-gray-600 border-gray-200' };
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border', cfg.cls)}>
      {cfg.label}
    </span>
  );
}

type TabId = 'planos' | 'custas' | 'contratos';

export default function FinanceiroClient(_props: Props) {
  const { planos, custas, contratos, clienteMap } = useFinanceiro();
  const [tab, setTab] = useState<TabId>('planos');
  const [statusFilter, setStatusFilter] = useState('');

  const receitaPrevista = planos.filter((p) => p.status === 'ativo').reduce((s, p) => s + (p.valor_total ?? 0), 0);
  const custasPendentesVal = custas.filter((c) => c.status === 'pendente').reduce((s, c) => s + (c.valor ?? 0), 0);
  const custasPagasVal = custas.filter((c) => c.status === 'pago').reduce((s, c) => s + (c.valor ?? 0), 0);
  const contratosAtivos = contratos.filter((c) => c.status === 'ativo' || c.status === 'assinado').length;

  const planosVisiveis = statusFilter ? planos.filter((p) => p.status === statusFilter) : planos;
  const custasVisiveis = statusFilter ? custas.filter((c) => c.status === statusFilter) : custas;
  const contratosVisiveis = statusFilter ? contratos.filter((c) => c.status === statusFilter) : contratos;

  const tabs: Array<{ id: TabId; label: string; count: number; Icon: React.ElementType }> = [
    { id: 'planos',    label: 'Planos de pagamento', count: planos.length,    Icon: CreditCard },
    { id: 'custas',    label: 'Custas processuais',  count: custas.length,    Icon: Receipt },
    { id: 'contratos', label: 'Contratos',           count: contratos.length, Icon: FileText },
  ];

  const activeFilters =
    tab === 'planos' ? PLANO_STATUS :
    tab === 'custas' ? CUSTA_STATUS :
    CONTRATO_STATUS;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Financeiro</h2>
        <p className="text-sm text-muted-foreground">Visão consolidada de planos, custas e contratos de todos os clientes</p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: 'Receita prevista', sub: 'planos ativos',
            value: fmt(receitaPrevista), Icon: TrendingUp,
            bg: 'bg-green-500/10', ic: 'text-green-500',
          },
          {
            label: 'Custas pendentes', sub: `${custas.filter((c) => c.status === 'pendente').length} registro(s)`,
            value: fmt(custasPendentesVal), Icon: AlertCircle,
            bg: 'bg-amber-500/10', ic: 'text-amber-500',
          },
          {
            label: 'Custas recebidas', sub: `${custas.filter((c) => c.status === 'pago').length} registro(s)`,
            value: fmt(custasPagasVal), Icon: CheckCircle2,
            bg: 'bg-teal-500/10', ic: 'text-teal-500',
          },
          {
            label: 'Contratos ativos', sub: `de ${contratos.length} total`,
            value: String(contratosAtivos), Icon: FileText,
            bg: 'bg-blue-500/10', ic: 'text-blue-500',
          },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={cn('p-1.5 rounded-lg', kpi.bg)}>
                <kpi.Icon className={cn('h-3.5 w-3.5', kpi.ic)} />
              </div>
              <span className="text-xs font-medium text-muted-foreground">{kpi.label}</span>
            </div>
            <p className="text-xl font-bold tabular-nums">{kpi.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Table area */}
      <div className="rounded-xl border border-border overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-border bg-muted/20 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setStatusFilter(''); }}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0',
                tab === t.id
                  ? 'text-primary border-b-2 border-primary bg-background'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <t.Icon className="h-3.5 w-3.5" />
              {t.label}
              <span className={cn(
                'inline-flex items-center justify-center min-w-[20px] h-5 rounded-full text-[10px] font-bold px-1',
                tab === t.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
              )}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-muted/10 overflow-x-auto">
          <span className="text-[11px] text-muted-foreground flex-shrink-0">Status:</span>
          <button
            onClick={() => setStatusFilter('')}
            className={cn(
              'text-xs px-2.5 py-0.5 rounded-full border transition-colors flex-shrink-0',
              !statusFilter ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            Todos
          </button>
          {Object.entries(activeFilters).map(([k, v]) => (
            <button
              key={k}
              onClick={() => setStatusFilter(statusFilter === k ? '' : k)}
              className={cn(
                'text-xs px-2.5 py-0.5 rounded-full border transition-colors flex-shrink-0',
                statusFilter === k ? v.cls : 'bg-muted border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {v.label}
            </button>
          ))}
        </div>

        {/* Planos table */}
        {tab === 'planos' && (
          planosVisiveis.length === 0
            ? <EmptyState icon={CreditCard} title="Nenhum plano" description="Nenhum plano de pagamento encontrado." />
            : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/10">
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Cliente / Título</th>
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs hidden sm:table-cell">Status</th>
                      <th className="text-right px-4 py-2.5 font-medium text-muted-foreground text-xs">Valor total</th>
                      <th className="text-right px-4 py-2.5 font-medium text-muted-foreground text-xs hidden md:table-cell">Parcela</th>
                      <th className="text-right px-4 py-2.5 font-medium text-muted-foreground text-xs hidden lg:table-cell">Prazo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {planosVisiveis.map((p) => (
                      <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium truncate max-w-[200px]">{clienteMap[p.user_id] ?? '—'}</p>
                          <p className="text-xs text-muted-foreground truncate">{p.titulo ?? 'Sem título'}</p>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <Badge status={p.status} config={PLANO_STATUS} />
                        </td>
                        <td className="px-4 py-3 text-right font-medium tabular-nums">{fmt(p.valor_total)}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground hidden md:table-cell tabular-nums">{fmt(p.parcela_sugerida)}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground hidden lg:table-cell">
                          {p.prazo_meses ? `${p.prazo_meses} meses` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
        )}

        {/* Custas table */}
        {tab === 'custas' && (
          custasVisiveis.length === 0
            ? <EmptyState icon={Receipt} title="Nenhuma custa" description="Nenhuma custa processual encontrada." />
            : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/10">
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Cliente / Descrição</th>
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs hidden sm:table-cell">Categoria</th>
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs hidden sm:table-cell">Status</th>
                      <th className="text-right px-4 py-2.5 font-medium text-muted-foreground text-xs">Valor</th>
                      <th className="text-right px-4 py-2.5 font-medium text-muted-foreground text-xs hidden md:table-cell">Vencimento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {custasVisiveis.map((c) => (
                      <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium truncate max-w-[200px]">{clienteMap[c.user_id] ?? '—'}</p>
                          <p className="text-xs text-muted-foreground truncate">{c.titulo ?? 'Sem título'}</p>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground capitalize hidden sm:table-cell">{c.categoria ?? '—'}</td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <Badge status={c.status} config={CUSTA_STATUS} />
                        </td>
                        <td className="px-4 py-3 text-right font-medium tabular-nums">{fmt(c.valor)}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground hidden md:table-cell">{fmtData(c.data_vencimento)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
        )}

        {/* Contratos table */}
        {tab === 'contratos' && (
          contratosVisiveis.length === 0
            ? <EmptyState icon={FileText} title="Nenhum contrato" description="Nenhum contrato encontrado." />
            : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/10">
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Cliente / Contrato</th>
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs hidden sm:table-cell">Tipo</th>
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs hidden sm:table-cell">Status</th>
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs hidden md:table-cell">Assinatura</th>
                      <th className="text-right px-4 py-2.5 font-medium text-muted-foreground text-xs hidden lg:table-cell">Assinado em</th>
                      <th className="px-4 py-2.5 hidden lg:table-cell" />
                    </tr>
                  </thead>
                  <tbody>
                    {contratosVisiveis.map((c) => (
                      <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium truncate max-w-[200px]">{clienteMap[c.user_id] ?? '—'}</p>
                          <p className="text-xs text-muted-foreground truncate">{c.titulo ?? 'Sem título'}</p>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground capitalize hidden sm:table-cell">{c.tipo ?? '—'}</td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <Badge status={c.status} config={CONTRATO_STATUS} />
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <Badge status={c.assinatura_status} config={ASSINATURA_STATUS} />
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground hidden lg:table-cell">{fmtData(c.assinado_em)}</td>
                        <td className="px-4 py-3 text-right hidden lg:table-cell">
                          {c.arquivo_url && (
                            <a
                              href={c.arquivo_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                              <ExternalLink className="h-3 w-3" /> Abrir
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
        )}
      </div>
    </div>
  );
}
