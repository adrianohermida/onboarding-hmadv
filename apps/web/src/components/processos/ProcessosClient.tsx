'use client';

import { useState, useCallback } from 'react';
import { Search, X, ChevronRight, ChevronLeft, Gavel, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useProcessosPaginados,
  useAtualizarProcesso,
  PROCESSOS_PAGE_SIZE,
  type Processo,
  type ProcessosFiltros,
  STATUS_PROCESSO_CONFIG,
  PRIORIDADE_PROCESSO_CONFIG,
} from '@/lib/hooks/use-processos';
import { useDebounce } from '@/lib/hooks/use-global-search';
import ProcessoDetalhePanel from './ProcessoDetalhePanel';

const STATUS_OPTIONS = ['em_andamento', 'aguardando', 'suspenso', 'encerrado', 'arquivado'] as const;
const PRIORIDADE_OPTIONS = ['critica', 'alta', 'media', 'baixa'] as const;

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

export default function ProcessosClient() {
  const [rawSearch, setRawSearch] = useState('');
  const [statusFiltro, setStatusFiltro] = useState<string | null>(null);
  const [prioridadeFiltro, setPrioridadeFiltro] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(rawSearch, 350);

  const filtros: ProcessosFiltros = {
    search: debouncedSearch,
    status: statusFiltro,
    prioridade: prioridadeFiltro,
  };

  const { data: result, isFetching } = useProcessosPaginados(filtros, page);
  const processos = result?.data ?? [];
  const total = result?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PROCESSOS_PAGE_SIZE));

  const atualizar = useAtualizarProcesso();
  const selected = selectedId ? processos.find((p) => p.id === selectedId) ?? null : null;
  const hasFilters = !!rawSearch || !!statusFiltro || !!prioridadeFiltro;

  const resetFilters = useCallback(() => {
    setRawSearch('');
    setStatusFiltro(null);
    setPrioridadeFiltro(null);
    setPage(0);
  }, []);

  function handleFilterChange(setter: (v: any) => void, value: any) {
    setter(value);
    setPage(0);
    setSelectedId(null);
  }

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
            value={rawSearch}
            onChange={(e) => handleFilterChange(setRawSearch, e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:bg-background transition-colors"
          />
        </div>

        <select
          value={statusFiltro ?? ''}
          onChange={(e) => handleFilterChange(setStatusFiltro, e.target.value || null)}
          className="px-2.5 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Todos os status</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{STATUS_PROCESSO_CONFIG[s]?.label ?? s}</option>
          ))}
        </select>

        <select
          value={prioridadeFiltro ?? ''}
          onChange={(e) => handleFilterChange(setPrioridadeFiltro, e.target.value || null)}
          className="px-2.5 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Toda prioridade</option>
          {PRIORIDADE_OPTIONS.map((p) => (
            <option key={p} value={p}>{PRIORIDADE_PROCESSO_CONFIG[p]?.label ?? p}</option>
          ))}
        </select>

        {hasFilters && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            Limpar
          </button>
        )}

        <div className="ml-auto flex items-center gap-2">
          {isFetching && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {total.toLocaleString('pt-BR')} processo{total !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Lista */}
        <div className={cn(
          'flex-1 overflow-y-auto flex flex-col',
          selected && 'hidden lg:flex lg:w-[440px] lg:flex-none border-r border-border',
        )}>
          {/* Tabela desktop */}
          <div className="hidden lg:block flex-1 overflow-y-auto">
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
                {!isFetching && processos.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-muted-foreground text-sm">
                      Nenhum processo encontrado.
                    </td>
                  </tr>
                )}
                {processos.map((p) => {
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
          <div className="lg:hidden divide-y divide-border flex-1 overflow-y-auto">
            {!isFetching && processos.length === 0 && (
              <div className="text-center py-12 text-muted-foreground text-sm">Nenhum processo encontrado.</div>
            )}
            {processos.map((p) => {
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

          {/* Paginação */}
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-muted/20 flex-shrink-0">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0 || isFetching}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Anterior
            </button>
            <span className="text-xs text-muted-foreground">
              Página {page + 1} de {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1 || isFetching}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              Próxima
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
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
