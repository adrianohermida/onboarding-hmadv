'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Search, X, ChevronRight, ChevronLeft, Gavel, Loader2, AlertCircle, ChevronsUpDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useProcessosPaginados,
  useAtualizarProcesso,
  useExcluirProcesso,
  useBulkAtualizarProcessos,
  useBulkExcluirProcessos,
  useBulkMesclarProcessos,
  useResponsaveisInternos,
  PROCESSOS_PAGE_SIZE,
  type Processo,
  type ProcessosFiltros,
  STATUS_PROCESSO_CONFIG,
  PRIORIDADE_PROCESSO_CONFIG,
  formatCnjDigits,
  isValidCnj,
  onlyDigits,
} from '@/lib/hooks/use-processos';
import { useDebounce } from '@/lib/hooks/use-global-search';
import ProcessoDetalhePanel from './ProcessoDetalhePanel';

const STATUS_OPTIONS = ['em_andamento', 'aguardando', 'suspenso', 'encerrado', 'arquivado'] as const;
const PRIORIDADE_OPTIONS = ['critica', 'alta', 'media', 'baixa'] as const;
const ROLE_ORDER = ['master_admin', 'tenant_admin', 'advogado', 'colaborador'];

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function renderStatusTone(status: string | null | undefined) {
  const key = String(status || '').toLowerCase();
  if (['em_andamento', 'aguardando', 'ativo'].includes(key)) return 'bg-green-500/10 text-green-600';
  if (['suspenso'].includes(key)) return 'bg-amber-500/10 text-amber-600';
  if (['baixado', 'arquivado', 'encerrado'].includes(key)) return 'bg-slate-500/10 text-slate-600';
  return 'bg-muted text-muted-foreground';
}

function buildProcessTitle(p: Processo) {
  const formattedCnj = formatCnjDigits(onlyDigits(p.numero_cnj || '')) || p.numero_cnj || 'Sem CNJ';
  const ativo = p.polo_ativo || 'Polo ativo';
  const passivo = p.polo_passivo || 'Polo passivo';
  return `${formattedCnj} (${ativo} x ${passivo})`;
}

function roleGroupLabel(role: string) {
  const key = String(role || '').trim();
  if (key === 'master_admin') return 'Master Admin';
  if (key === 'tenant_admin') return 'Admin';
  if (key === 'advogado') return 'Advogado';
  if (key === 'colaborador') return 'Colaborador';
  return key || 'Outros';
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function renderHighlightedText(text: string, query: string) {
  const source = String(text || '');
  const normalizedQuery = String(query || '').trim();
  if (!normalizedQuery) return source;
  const regex = new RegExp(`(${escapeRegex(normalizedQuery)})`, 'ig');
  const chunks = source.split(regex);
  return chunks.map((chunk, index) => {
    const matched = chunk.toLowerCase() === normalizedQuery.toLowerCase();
    if (!matched) return <span key={`${chunk}-${index}`}>{chunk}</span>;
    return (
      <mark key={`${chunk}-${index}`} className="rounded bg-amber-200/70 px-0.5 text-foreground">
        {chunk}
      </mark>
    );
  });
}

function ResponsavelSelect({
  value,
  onChange,
  options,
  placeholder,
  allLabel,
  className = '',
}: {
  value: string | null;
  onChange: (next: string | null) => void;
  options: Array<{ user_id: string; role: string; label: string; email: string | null }>;
  placeholder: string;
  allLabel?: string;
  className?: string;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selectedLabel = useMemo(
    () => options.find((item) => item.user_id === value)?.label || '',
    [options, value]
  );

  const grouped = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = !query
      ? options
      : options.filter((item) => {
          const hay = `${item.label} ${item.email || ''} ${item.role}`.toLowerCase();
          return hay.includes(query);
        });

    const buckets = new Map<string, typeof filtered>();
    filtered.forEach((item) => {
      const key = item.role || 'outros';
      const current = buckets.get(key) || [];
      current.push(item);
      buckets.set(key, current);
    });

    const groupedEntries = Array.from(buckets.entries())
      .sort((a, b) => {
        const ai = ROLE_ORDER.indexOf(a[0]);
        const bi = ROLE_ORDER.indexOf(b[0]);
        if (ai === -1 && bi === -1) return a[0].localeCompare(b[0], 'pt-BR');
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      })
      .map(([role, items]) => ({ role, label: roleGroupLabel(role), items }));

    return groupedEntries;
  }, [options, search]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  useEffect(() => {
    if (!open) setSearch('');
  }, [open]);

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="w-full px-2.5 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-left flex items-center justify-between gap-2"
      >
        <span className="truncate text-foreground/90">{renderHighlightedText(selectedLabel || allLabel || placeholder, search)}</span>
        <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
      </button>

      {open && (
        <div className="absolute z-40 mt-1 w-full min-w-[320px] rounded-lg border border-border bg-background shadow-lg">
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar responsável"
                className="w-full pl-8 pr-2 py-1.5 text-xs bg-muted/50 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="max-h-64 overflow-auto p-1.5">
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
              className="w-full px-2 py-1.5 text-left text-xs rounded hover:bg-muted flex items-center justify-between"
            >
              <span>{allLabel || 'Todos'}</span>
              {!value ? <Check className="h-3.5 w-3.5 text-primary" /> : null}
            </button>

            {grouped.length === 0 ? (
              <p className="px-2 py-3 text-xs text-muted-foreground">Nenhum responsável encontrado.</p>
            ) : grouped.map((group) => (
              <div key={group.role} className="mt-1">
                <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{group.label}</p>
                {group.items.map((item) => (
                  <button
                    key={item.user_id}
                    type="button"
                    onClick={() => {
                      onChange(item.user_id);
                      setOpen(false);
                    }}
                    className="w-full px-2 py-1.5 text-left text-xs rounded hover:bg-muted flex items-start justify-between gap-2"
                  >
                    <span className="min-w-0 truncate">{renderHighlightedText(item.label, search)}</span>
                    {value === item.user_id ? <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" /> : null}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProcessosClient() {
  const [rawSearch, setRawSearch] = useState('');
  const [statusFiltro, setStatusFiltro] = useState<string | null>(null);
  const [prioridadeFiltro, setPrioridadeFiltro] = useState<string | null>(null);
  const [responsavelFiltro, setResponsavelFiltro] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<string>('');
  const [bulkResponsavel, setBulkResponsavel] = useState<string>('');

  const debouncedSearch = useDebounce(rawSearch, 350);

  const filtros: ProcessosFiltros = {
    search: debouncedSearch,
    status: statusFiltro,
    prioridade: prioridadeFiltro,
    responsavel: responsavelFiltro,
  };

  const { data: result, isFetching } = useProcessosPaginados(filtros, page);
  const { data: responsaveisInternos = [] } = useResponsaveisInternos();
  const processos = result?.data ?? [];
  const total = result?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PROCESSOS_PAGE_SIZE));

  const atualizar = useAtualizarProcesso();
  const excluir = useExcluirProcesso();
  const bulkAtualizar = useBulkAtualizarProcessos();
  const bulkExcluir = useBulkExcluirProcessos();
  const bulkMesclar = useBulkMesclarProcessos();
  const selected = selectedId ? processos.find((p) => p.id === selectedId) ?? null : null;
  const hasFilters = !!rawSearch || !!statusFiltro || !!prioridadeFiltro || !!responsavelFiltro;
  const pageIds = useMemo(() => processos.map((p) => p.id), [processos]);
  const responsavelLabelById = useMemo(
    () => new Map(responsaveisInternos.map((item) => [item.user_id, item.label])),
    [responsaveisInternos]
  );
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
  const cnjDigits = onlyDigits(rawSearch);
  const looksLikeCnj = cnjDigits.length === 20;
  const cnjValid = looksLikeCnj ? isValidCnj(rawSearch) : null;
  const isBusy = isFetching || atualizar.isPending || excluir.isPending || bulkAtualizar.isPending || bulkExcluir.isPending || bulkMesclar.isPending;

  const resetFilters = useCallback(() => {
    setRawSearch('');
    setStatusFiltro(null);
    setPrioridadeFiltro(null);
    setResponsavelFiltro(null);
    setPage(0);
  }, []);

  function handleFilterChange(setter: (v: any) => void, value: any) {
    setter(value);
    setPage(0);
    setSelectedId(null);
    setSelectedIds([]);
  }

  function handleUpdate(id: string, patch: Partial<Pick<Processo, 'status' | 'prioridade' | 'monitoramento_ativo' | 'responsavel'>>) {
    atualizar.mutate({ id, patch });
  }

  function toggleSelection(id: string) {
    setSelectedIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  }

  function togglePageSelection() {
    if (allPageSelected) {
      setSelectedIds((current) => current.filter((id) => !pageIds.includes(id)));
      return;
    }
    setSelectedIds((current) => [...new Set([...current, ...pageIds])]);
  }

  async function handleRowAction(id: string, action: string) {
    if (action === 'editar') {
      setSelectedId(id);
      return;
    }
    if (action === 'arquivar') {
      await atualizar.mutateAsync({ id, patch: { status: 'arquivado' } });
      return;
    }
    if (action === 'excluir') {
      await excluir.mutateAsync(id);
      setSelectedIds((current) => current.filter((value) => value !== id));
    }
  }

  async function handleBulkStatusApply() {
    if (!bulkStatus || !selectedIds.length) return;
    await bulkAtualizar.mutateAsync({ ids: selectedIds, patch: { status: bulkStatus } });
    setBulkStatus('');
  }

  async function handleBulkResponsavelApply() {
    if (!bulkResponsavel || !selectedIds.length) return;
    await bulkAtualizar.mutateAsync({ ids: selectedIds, patch: { responsavel: bulkResponsavel } });
    setBulkResponsavel('');
  }

  async function handleBulkMerge() {
    if (selectedIds.length < 2) return;
    await bulkMesclar.mutateAsync({ destinationId: selectedIds[0], sourceIds: selectedIds });
    setSelectedIds([selectedIds[0]]);
  }

  async function handleBulkDelete() {
    if (!selectedIds.length) return;
    await bulkExcluir.mutateAsync(selectedIds);
    setSelectedIds([]);
    setSelectedId(null);
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 lg:px-6 py-3 border-b border-border bg-background flex-shrink-0 flex-wrap">
        <div className="relative flex-1 min-w-44">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Parte, CNJ/NUP, assunto, classe, responsável"
            value={rawSearch}
            onChange={(e) => handleFilterChange(setRawSearch, e.target.value)}
            title="CNJ: NNNNNNN-DD.AAAA.J.TR.OOOO (20 dígitos, DV em módulo 97 base 10)"
            className="w-full pl-9 pr-3 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:bg-background transition-colors"
          />
        </div>

        <select
          value={statusFiltro ?? ''}
          onChange={(e) => handleFilterChange(setStatusFiltro, e.target.value || null)}
          className="px-2.5 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Todos os status</option>
          <option value="ativo">Ativo</option>
          <option value="baixado">Baixado</option>
          <option value="suspenso">Suspenso</option>
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

        <ResponsavelSelect
          value={responsavelFiltro}
          onChange={(next) => handleFilterChange(setResponsavelFiltro, next)}
          options={responsaveisInternos}
          allLabel="Todos responsáveis"
          placeholder="Responsável"
          className="min-w-[260px]"
        />

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
          {looksLikeCnj && (
            <span className={cn('inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full border', cnjValid ? 'border-green-300 bg-green-50 text-green-700' : 'border-rose-300 bg-rose-50 text-rose-700')}>
              <AlertCircle className="h-3 w-3" />
              {cnjValid ? 'CNJ válido' : 'CNJ inválido'}
            </span>
          )}
          {isFetching && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {total.toLocaleString('pt-BR')} processo{total !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="px-4 lg:px-6 py-2 border-b border-border bg-muted/20 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">{selectedIds.length} selecionado(s)</span>
          <button
            onClick={handleBulkMerge}
            disabled={selectedIds.length < 2 || isBusy}
            className="px-2.5 py-1.5 text-xs rounded-md border border-border hover:bg-muted disabled:opacity-50"
          >
            Mesclar processos
          </button>
          <select
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-background border border-border rounded-md"
          >
            <option value="">Alterar status...</option>
            <option value="em_andamento">Ativo</option>
            <option value="baixado">Baixado</option>
            <option value="suspenso">Suspenso</option>
          </select>
          <button
            onClick={handleBulkStatusApply}
            disabled={!bulkStatus || isBusy}
            className="px-2.5 py-1.5 text-xs rounded-md border border-border hover:bg-muted disabled:opacity-50"
          >
            Aplicar status
          </button>
          <ResponsavelSelect
            value={bulkResponsavel || null}
            onChange={(next) => setBulkResponsavel(next || '')}
            options={responsaveisInternos}
            allLabel="Responsável interno..."
            placeholder="Responsável interno"
            className="min-w-[280px]"
          />
          <button
            onClick={handleBulkResponsavelApply}
            disabled={!bulkResponsavel || isBusy}
            className="px-2.5 py-1.5 text-xs rounded-md border border-border hover:bg-muted disabled:opacity-50"
          >
            Aplicar responsável
          </button>
          <button
            onClick={handleBulkDelete}
            disabled={isBusy}
            className="px-2.5 py-1.5 text-xs rounded-md border border-rose-300 text-rose-700 hover:bg-rose-50 disabled:opacity-50"
          >
            Excluir
          </button>
        </div>
      )}

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
                  <th className="px-3 py-3">
                    <input type="checkbox" checked={allPageSelected} onChange={togglePageSelection} />
                  </th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">CNJ e polos</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Prioridade</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Responsável</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Mov.</th>
                  <th className="w-8" />
                  <th className="text-left px-2 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {!isFetching && processos.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-muted-foreground text-sm">
                      Nenhum processo encontrado.
                    </td>
                  </tr>
                )}
                {processos.map((p) => {
                  const sCfg = p.status ? STATUS_PROCESSO_CONFIG[p.status] : null;
                  const priCfg = p.prioridade ? PRIORIDADE_PROCESSO_CONFIG[p.prioridade] : null;
                  const active = selectedId === p.id;
                  const isSelected = selectedIds.includes(p.id);
                  return (
                    <tr
                      key={p.id}
                      onClick={() => setSelectedId(active ? null : p.id)}
                      className={cn(
                        'cursor-pointer transition-colors hover:bg-muted/40',
                        active && 'bg-primary/5 border-l-2 border-l-primary',
                      )}
                    >
                      <td className="px-3 py-3" onClick={(event) => event.stopPropagation()}>
                        <input type="checkbox" checked={isSelected} onChange={() => toggleSelection(p.id)} />
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-mono text-xs font-semibold text-foreground leading-tight truncate max-w-[280px]">
                          {buildProcessTitle(p)}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{p.tribunal ?? '—'}</p>
                        {p.segredo_justica && (
                          <span className="inline-flex mt-1 rounded-full bg-red-600 text-white text-[10px] px-2 py-0.5 font-semibold">Segredo de Justiça</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {sCfg
                          ? <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold', renderStatusTone(p.status), sCfg.cls)}>{sCfg.label}</span>
                          : <span className="text-xs text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {priCfg
                          ? <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset', priCfg.cls)}>{priCfg.label}</span>
                          : <span className="text-xs text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{responsavelLabelById.get(String(p.responsavel || '').trim()) || p.responsavel || '—'}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(p.data_ultima_movimentacao)}
                      </td>
                      <td className="pr-3">
                        <ChevronRight className={cn('h-4 w-4 text-muted-foreground/50 transition-transform', active && 'rotate-90')} />
                      </td>
                      <td className="px-2 py-3" onClick={(event) => event.stopPropagation()}>
                        <select
                          defaultValue=""
                          onChange={async (event) => {
                            await handleRowAction(p.id, event.target.value);
                            event.currentTarget.value = '';
                          }}
                          className="text-[11px] px-2 py-1 bg-background border border-border rounded"
                        >
                          <option value="">Ações</option>
                          <option value="editar">Editar</option>
                          <option value="arquivar">Arquivar</option>
                          <option value="excluir">Excluir</option>
                        </select>
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
                      <p className="font-mono text-xs font-semibold text-foreground truncate">{buildProcessTitle(p)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{p.tribunal ?? '—'}</p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {sCfg && (
                          <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold', renderStatusTone(p.status), sCfg.cls)}>
                            {sCfg.label}
                          </span>
                        )}
                        {priCfg && (
                          <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset', priCfg.cls)}>
                            {priCfg.label}
                          </span>
                        )}
                        {p.segredo_justica && (
                          <span className="inline-flex rounded-full bg-red-600 text-white text-[10px] px-2 py-0.5 font-semibold">Segredo de Justiça</span>
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
              disabled={page === 0 || isBusy}
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
              disabled={page >= totalPages - 1 || isBusy}
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
