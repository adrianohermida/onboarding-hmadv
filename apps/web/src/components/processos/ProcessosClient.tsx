'use client';

import { useState, useMemo } from 'react';
import { Search, X, ChevronRight, Gavel } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useProcessos,
  useAtualizarProcesso,
  Processo,
  STATUS_PROCESSO_CONFIG,
  PRIORIDADE_PROCESSO_CONFIG,
} from '@/lib/hooks/use-processos';
import ProcessoDetalhePanel from './ProcessoDetalhePanel';

interface Props {
  initial: Processo[];
  isAdmin: boolean;
}

const STATUS_OPTIONS = ['em_andamento', 'aguardando', 'suspenso', 'encerrado', 'arquivado'] as const;
const PRIORIDADE_OPTIONS = ['critica', 'alta', 'media', 'baixa'] as const;

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

export default function ProcessosClient({ initial }: Props) {
  const { data = initial } = useProcessos();
  const atualizar = useAtualizarProcesso();

  const [search, setSearch] = useState('');
  const [statusFiltro, setStatusFiltro] = useState<string | null>(null);
  const [prioridadeFiltro, setPrioridadeFiltro] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = data;
    const q = search.toLowerCase().trim();
    if (q) {
      list = list.filter((p) =>
        [p.numero_cnj, p.tribunal, p.comarca, p.classe, p.assunto, p.orgao_julgador]
          .some((v) => v?.toLowerCase().includes(q))
      );
    }
    if (statusFiltro) list = list.filter((p) => p.status === statusFiltro);
    if (prioridadeFiltro) list = list.filter((p) => p.prioridade === prioridadeFiltro);
    return list;
  }, [data, search, statusFiltro, prioridadeFiltro]);

  const selected = selectedId ? data.find((p) => p.id === selectedId) ?? null : null;
  const hasFilters = !!search || !!statusFiltro || !!prioridadeFiltro;

  function handleUpdate(id: string, patch: Partial<Pick<Processo, 'status' | 'prioridade' | 'monitoramento_ativo'>>) {
    atualizar.mutate({ id, patch });
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 lg:px-6 py-3 border-b border-border bg-background flex-shrink-0 flex-wrap">
        <div className="relative flex-1 min-w-44">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Número CNJ, tribunal, classe..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:bg-background transition-colors"
          />
        </div>

        <select
          value={statusFiltro ?? ''}
          onChange={(e) => setStatusFiltro(e.target.value || null)}
          className="px-2.5 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Todos os status</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{STATUS_PROCESSO_CONFIG[s]?.label ?? s}</option>
          ))}
        </select>

        <select
          value={prioridadeFiltro ?? ''}
          onChange={(e) => setPrioridadeFiltro(e.target.value || null)}
          className="px-2.5 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Toda prioridade</option>
          {PRIORIDADE_OPTIONS.map((p) => (
            <option key={p} value={p}>{PRIORIDADE_PROCESSO_CONFIG[p]?.label ?? p}</option>
          ))}
        </select>

        {hasFilters && (
          <button
            onClick={() => { setSearch(''); setStatusFiltro(null); setPrioridadeFiltro(null); }}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            Limpar
          </button>
        )}

        <span className="text-xs text-muted-foreground ml-auto whitespace-nowrap">
          {filtered.length} processo{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Lista */}
        <div className={cn(
          'flex-1 overflow-y-auto',
          selected && 'hidden lg:block lg:w-[440px] lg:flex-none border-r border-border',
        )}>
          {/* Tabela desktop */}
          <div className="hidden lg:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30 sticky top-0 z-10">
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Número / Tribunal</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Prioridade</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Mov.</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-muted-foreground text-sm">
                      Nenhum processo encontrado.
                    </td>
                  </tr>
                )}
                {filtered.map((p) => {
                  const sCfg = p.status ? STATUS_PROCESSO_CONFIG[p.status] : null;
                  const priCfg = p.prioridade ? PRIORIDADE_PROCESSO_CONFIG[p.prioridade] : null;
                  const active = selectedId === p.id;
                  return (
                    <tr
                      key={p.id}
                      onClick={() => setSelectedId(active ? null : p.id)}
                      className={cn(
                        'cursor-pointer transition-colors hover:bg-muted/40',
                        active && 'bg-primary/5 border-l-2 border-l-primary',
                      )}
                    >
                      <td className="px-4 py-3">
                        <p className="font-mono text-xs font-semibold text-foreground leading-tight truncate max-w-[160px]">
                          {p.numero_cnj ?? '—'}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{p.tribunal ?? '—'}</p>
                      </td>
                      <td className="px-4 py-3">
                        {sCfg
                          ? <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold', sCfg.cls)}>{sCfg.label}</span>
                          : <span className="text-xs text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {priCfg
                          ? <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset', priCfg.cls)}>{priCfg.label}</span>
                          : <span className="text-xs text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(p.data_ultima_movimentacao)}
                      </td>
                      <td className="pr-3">
                        <ChevronRight className={cn('h-4 w-4 text-muted-foreground/50 transition-transform', active && 'rotate-90')} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Cards mobile */}
          <div className="lg:hidden divide-y divide-border">
            {filtered.length === 0 && (
              <div className="text-center py-12 text-muted-foreground text-sm">Nenhum processo encontrado.</div>
            )}
            {filtered.map((p) => {
              const sCfg = p.status ? STATUS_PROCESSO_CONFIG[p.status] : null;
              const priCfg = p.prioridade ? PRIORIDADE_PROCESSO_CONFIG[p.prioridade] : null;
              return (
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
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{p.tribunal ?? '—'}</p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {sCfg && (
                          <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold', sCfg.cls)}>
                            {sCfg.label}
                          </span>
                        )}
                        {priCfg && (
                          <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset', priCfg.cls)}>
                            {priCfg.label}
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground">{formatDate(p.data_ultima_movimentacao)}</span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/50 flex-shrink-0 mt-2" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Painel de detalhe */}
        {selected && (
          <div className={cn(
            'bg-background overflow-y-auto',
            'fixed inset-0 z-50 lg:static lg:flex-1 lg:z-auto',
          )}>
            <ProcessoDetalhePanel
              processo={selected}
              onClose={() => setSelectedId(null)}
              onUpdate={handleUpdate}
            />
          </div>
        )}
      </div>
    </div>
  );
}
