'use client';

import { useState, useMemo } from 'react';
import { Search, Gavel, Calendar, Building2, Scale, ChevronRight, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Processo {
  id: string;
  caso_id: string | null;
  numero_cnj: string | null;
  tribunal: string | null;
  grau: number | null;
  classe_nome: string | null;
  assunto_principal: string | null;
  orgao_julgador: string | null;
  data_distribuicao: string | null;
  ultima_movimentacao: string | null;
  valor_causa: number | null;
  sincronizado_em: string | null;
  casos: { nome_cliente: string } | null;
}

interface Props {
  processos: Processo[];
  isAdmin: boolean;
}

function grauLabel(grau: number | null) {
  if (grau === 1) return '1º Grau';
  if (grau === 2) return '2º Grau';
  if (grau === 3) return 'Superior';
  return '—';
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatCurrency(val: number | null) {
  if (val == null) return '—';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
}

function GrauBadge({ grau }: { grau: number | null }) {
  const label = grauLabel(grau);
  const colors: Record<string, string> = {
    '1º Grau': 'bg-blue-500/10 text-blue-400 ring-blue-500/20',
    '2º Grau': 'bg-purple-500/10 text-purple-400 ring-purple-500/20',
    'Superior': 'bg-amber-500/10 text-amber-400 ring-amber-500/20',
  };
  const cls = colors[label] ?? 'bg-muted text-muted-foreground ring-border';
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset', cls)}>
      {label}
    </span>
  );
}

export default function ProcessosClient({ processos, isAdmin }: Props) {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return processos;
    return processos.filter((p) =>
      [p.numero_cnj, p.tribunal, p.classe_nome, p.assunto_principal, p.orgao_julgador, p.casos?.nome_cliente]
        .some((v) => v?.toLowerCase().includes(q))
    );
  }, [processos, search]);

  const selected = selectedId ? processos.find((p) => p.id === selectedId) ?? null : null;

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 lg:px-6 py-4 border-b border-border bg-background flex-shrink-0">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar número, tribunal, classe..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:bg-background transition-colors"
          />
        </div>
        <span className="text-xs text-muted-foreground">
          {filtered.length} processo{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* List */}
        <div className={cn('flex-1 overflow-y-auto', selected && 'hidden lg:block lg:max-w-[480px] lg:flex-none border-r border-border')}>
          {/* Desktop table */}
          <div className="hidden lg:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30 sticky top-0">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Número / Tribunal</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Classe</th>
                  {isAdmin && (
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cliente</th>
                  )}
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Atualizado</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={isAdmin ? 5 : 4} className="text-center py-12 text-muted-foreground text-sm">
                      Nenhum processo encontrado.
                    </td>
                  </tr>
                )}
                {filtered.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => setSelectedId(selectedId === p.id ? null : p.id)}
                    className={cn(
                      'cursor-pointer transition-colors hover:bg-muted/40',
                      selectedId === p.id && 'bg-muted/60',
                    )}
                  >
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs font-semibold text-foreground leading-tight">
                        {p.numero_cnj ?? '—'}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{p.tribunal ?? '—'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <GrauBadge grau={p.grau} />
                        <span className="text-xs text-muted-foreground line-clamp-1">{p.classe_nome ?? '—'}</span>
                      </div>
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <span className="text-xs text-foreground">{p.casos?.nome_cliente ?? '—'}</span>
                      </td>
                    )}
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(p.ultima_movimentacao ?? p.sincronizado_em)}
                    </td>
                    <td className="pr-3">
                      <ChevronRight className={cn('h-4 w-4 text-muted-foreground/50 transition-transform', selectedId === p.id && 'rotate-90')} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden divide-y divide-border">
            {filtered.length === 0 && (
              <div className="text-center py-12 text-muted-foreground text-sm">
                Nenhum processo encontrado.
              </div>
            )}
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className="w-full text-left px-4 py-4 hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-muted flex items-center justify-center mt-0.5">
                    <Gavel className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-xs font-semibold text-foreground truncate">{p.numero_cnj ?? '—'}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{p.tribunal ?? '—'}</p>
                    {isAdmin && p.casos?.nome_cliente && (
                      <p className="text-xs text-primary mt-1">{p.casos.nome_cliente}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <GrauBadge grau={p.grau} />
                      <span className="text-[10px] text-muted-foreground">{formatDate(p.ultima_movimentacao ?? p.sincronizado_em)}</span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/50 flex-shrink-0 mt-2" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Detail panel */}
        {selected && (
          <div className={cn(
            'bg-background overflow-y-auto',
            'fixed inset-0 z-50 lg:static lg:flex-1 lg:z-auto',
          )}>
            <ProcessoDetail processo={selected} isAdmin={isAdmin} onClose={() => setSelectedId(null)} />
          </div>
        )}
      </div>
    </div>
  );
}

function ProcessoDetail({ processo: p, isAdmin, onClose }: { processo: Processo; isAdmin: boolean; onClose: () => void }) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-border flex-shrink-0">
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <ChevronRight className="h-4 w-4 rotate-180" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-mono text-sm font-bold text-foreground truncate">{p.numero_cnj ?? 'Sem número'}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{p.tribunal ?? '—'}</p>
        </div>
        <GrauBadge grau={p.grau} />
        <button
          onClick={onClose}
          className="hidden lg:block p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3">
          <InfoCard icon={Scale} label="Classe" value={p.classe_nome} />
          <InfoCard icon={Building2} label="Órgão Julgador" value={p.orgao_julgador} />
          <InfoCard icon={Calendar} label="Distribuição" value={formatDate(p.data_distribuicao)} />
          <InfoCard icon={Calendar} label="Última Mov." value={formatDate(p.ultima_movimentacao)} />
        </div>

        {/* Assunto */}
        {p.assunto_principal && (
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Assunto Principal</h3>
            <p className="text-sm text-foreground bg-muted/40 rounded-lg px-4 py-3">{p.assunto_principal}</p>
          </section>
        )}

        {/* Valor da causa */}
        {p.valor_causa != null && (
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Valor da Causa</h3>
            <p className="text-lg font-bold text-foreground">{formatCurrency(p.valor_causa)}</p>
          </section>
        )}

        {/* Cliente */}
        {isAdmin && p.casos?.nome_cliente && (
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Cliente Vinculado</h3>
            <div className="flex items-center gap-3 bg-muted/40 rounded-lg px-4 py-3">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs text-primary-foreground font-bold flex-shrink-0">
                {p.casos.nome_cliente.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-foreground">{p.casos.nome_cliente}</span>
            </div>
          </section>
        )}

        {/* Sync info */}
        {p.sincronizado_em && (
          <p className="text-[11px] text-muted-foreground/60 text-center">
            Sincronizado em {formatDate(p.sincronizado_em)}
          </p>
        )}
      </div>
    </div>
  );
}

function InfoCard({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | null | undefined }) {
  return (
    <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className="h-3 w-3 text-muted-foreground" />
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      </div>
      <p className="text-sm font-medium text-foreground line-clamp-2">{value ?? '—'}</p>
    </div>
  );
}
