'use client';

import { useState } from 'react';
import { Clock, AlertTriangle, CheckCircle2, Calendar, Plus, X, Search, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  usePrazosPaginados,
  usePrazosContagens,
  useAtualizarPrazo,
  useCriarPrazoManual,
  type PrazoCalculado,
  type PrazosPaginadosFiltros,
  PRAZOS_PAGE_SIZE,
  URGENCIA_PRAZO_CONFIG,
  PRIORIDADE_PROCESSO_CONFIG,
  prazoUrgencia,
} from '@/lib/hooks/use-processos';
import { useDebounce } from '@/lib/hooks/use-global-search';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function NovoPrazoForm({ onClose }: { onClose: () => void }) {
  const [titulo, setTitulo] = useState('');
  const [vencimento, setVencimento] = useState('');
  const [prioridade, setPrioridade] = useState('media');
  const [baseLegal, setBaseLegal] = useState('');
  const criar = useCriarPrazoManual();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim() || !vencimento) return;
    await criar.mutateAsync({
      processo_id: null,
      publicacao_id: null,
      titulo: titulo.trim(),
      descricao: null,
      data_vencimento: vencimento,
      status: 'pendente',
      prioridade,
      base_legal: baseLegal || null,
    });
    onClose();
  }

  return (
    <form onSubmit={submit} className="bg-card border border-border rounded-xl p-4 space-y-3 mb-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Novo prazo manual</p>
        <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      <input
        autoFocus
        placeholder="Título do prazo*"
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        required
        className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
      />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] text-muted-foreground mb-1">Vencimento*</label>
          <input
            type="date"
            value={vencimento}
            onChange={(e) => setVencimento(e.target.value)}
            required
            className="w-full px-2 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="block text-[11px] text-muted-foreground mb-1">Prioridade</label>
          <select
            value={prioridade}
            onChange={(e) => setPrioridade(e.target.value)}
            className="w-full px-2 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="critica">Crítica</option>
            <option value="alta">Alta</option>
            <option value="media">Média</option>
            <option value="baixa">Baixa</option>
          </select>
        </div>
      </div>

      <input
        placeholder="Base legal (opcional)"
        value={baseLegal}
        onChange={(e) => setBaseLegal(e.target.value)}
        className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
      />

      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onClose}
          className="flex-1 px-3 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors">
          Cancelar
        </button>
        <button type="submit" disabled={!titulo.trim() || !vencimento || criar.isPending}
          className="flex-1 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors">
          {criar.isPending ? 'Criando…' : 'Criar prazo'}
        </button>
      </div>
    </form>
  );
}

const URGENCIA_ICON = {
  vencida: AlertTriangle,
  hoje:    Clock,
  semana:  Calendar,
  ok:      CheckCircle2,
};

const URGENCIA_KPI_CLS = {
  vencida: { bg: 'bg-rose-500/10',   icon: 'text-rose-500' },
  hoje:    { bg: 'bg-orange-500/10', icon: 'text-orange-500' },
  semana:  { bg: 'bg-amber-500/10',  icon: 'text-amber-500' },
  ok:      { bg: 'bg-green-500/10',  icon: 'text-green-500' },
};

export default function PrazosClient() {
  const [search, setSearch] = useState('');
  const [statusFiltro, setStatusFiltro] = useState<string | null>(null);
  const [urgenciaFiltro, setUrgenciaFiltro] = useState<PrazosPaginadosFiltros['urgencia']>(null);
  const [prioridadeFiltro, setPrioridadeFiltro] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(0);

  const debouncedSearch = useDebounce(search, 350);

  const filtros: PrazosPaginadosFiltros = {
    search: debouncedSearch,
    status: statusFiltro,
    prioridade: prioridadeFiltro,
    urgencia: urgenciaFiltro,
  };

  const { data: paginados, isFetching } = usePrazosPaginados(filtros, page);
  const { data: contagens = { vencida: 0, hoje: 0, semana: 0, ok: 0 } } = usePrazosContagens();
  const atualizar = useAtualizarPrazo();

  const items = paginados?.data ?? [];
  const total = paginados?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PRAZOS_PAGE_SIZE));

  function handleFilterChange(fn: () => void) {
    fn();
    setPage(0);
  }

  function toggleConcluido(prazo: PrazoCalculado) {
    const novoStatus = prazo.status === 'concluido' ? 'pendente' : 'concluido';
    atualizar.mutate({ id: prazo.id, processoId: prazo.processo_id, patch: { status: novoStatus } });
  }

  const hasFilters = !!search || !!statusFiltro || !!urgenciaFiltro || !!prioridadeFiltro;

  return (
    <div className="space-y-5 max-w-3xl">
      {/* KPIs — contagens reais do Supabase */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(Object.entries(contagens) as [keyof typeof contagens, number][]).map(([key, val]) => {
          const cfg    = URGENCIA_PRAZO_CONFIG[key];
          const kpiCls = URGENCIA_KPI_CLS[key];
          const Icon   = URGENCIA_ICON[key];
          return (
            <button
              key={key}
              onClick={() => handleFilterChange(() => setUrgenciaFiltro(urgenciaFiltro === key ? null : key))}
              className={cn(
                'bg-card border border-border rounded-xl p-4 text-left transition-all hover:border-primary/40',
                urgenciaFiltro === key && 'ring-2 ring-primary border-primary/60',
              )}
            >
              <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center mb-2', kpiCls.bg)}>
                <Icon className={cn('h-3.5 w-3.5', kpiCls.icon)} />
              </div>
              <p className="text-2xl font-bold tabular-nums">{val}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{cfg.label}</p>
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-44">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar prazo, base legal..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="w-full pl-9 pr-3 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:bg-background transition-colors"
          />
        </div>

        <select
          value={prioridadeFiltro ?? ''}
          onChange={(e) => handleFilterChange(() => setPrioridadeFiltro(e.target.value || null))}
          className="px-2.5 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Toda prioridade</option>
          <option value="critica">Crítica</option>
          <option value="alta">Alta</option>
          <option value="media">Média</option>
          <option value="baixa">Baixa</option>
        </select>

        <select
          value={statusFiltro ?? ''}
          onChange={(e) => handleFilterChange(() => setStatusFiltro(e.target.value || null))}
          className="px-2.5 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Todo status</option>
          <option value="pendente">Pendente</option>
          <option value="concluido">Concluído</option>
          <option value="cancelado">Cancelado</option>
        </select>

        {hasFilters && (
          <button
            onClick={() => { setSearch(''); setUrgenciaFiltro(null); setPrioridadeFiltro(null); setStatusFiltro(null); setPage(0); }}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            Limpar
          </button>
        )}

        <div className="flex-1" />
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Novo prazo
        </button>
      </div>

      {showForm && <NovoPrazoForm onClose={() => setShowForm(false)} />}

      {/* Lista */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {isFetching && items.length === 0 ? (
          <div className="flex items-center justify-center py-10 gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Carregando prazos…</span>
          </div>
        ) : items.length === 0 ? (
          <div className="py-10 text-center">
            <Clock className="h-6 w-6 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Nenhum prazo encontrado.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {items.map((prazo) => {
              const urgencia = prazoUrgencia(prazo.data_vencimento);
              const uCfg    = URGENCIA_PRAZO_CONFIG[urgencia];
              const priCfg  = prazo.prioridade ? PRIORIDADE_PROCESSO_CONFIG[prazo.prioridade] : null;
              const concluido = prazo.status === 'concluido';

              return (
                <div
                  key={prazo.id}
                  className={cn(
                    'flex items-start gap-3 px-4 py-3.5 hover:bg-muted/30 transition-colors',
                    urgencia === 'vencida' && !concluido && 'bg-rose-500/5',
                    urgencia === 'hoje'    && !concluido && 'bg-orange-500/5',
                  )}
                >
                  <button
                    onClick={() => toggleConcluido(prazo)}
                    className="flex-shrink-0 mt-0.5 text-muted-foreground hover:text-primary transition-colors"
                    title={concluido ? 'Reabrir' : 'Marcar como concluído'}
                  >
                    {concluido
                      ? <CheckCircle2 className="h-5 w-5 text-green-500" />
                      : <Clock className="h-5 w-5" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={cn('text-sm font-medium', concluido && 'line-through text-muted-foreground')}>
                        {prazo.titulo ?? 'Sem título'}
                      </p>
                      {!concluido && (
                        <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded ring-1 ring-inset', uCfg.cls)}>
                          {uCfg.label}
                        </span>
                      )}
                      {priCfg && (
                        <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded ring-1 ring-inset', priCfg.cls)}>
                          {priCfg.label}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className={cn('flex items-center gap-1 text-xs', urgencia === 'vencida' && !concluido ? 'text-rose-500' : 'text-muted-foreground')}>
                        <Calendar className="h-3 w-3" />
                        {formatDate(prazo.data_vencimento)}
                      </span>
                      {prazo.base_legal && (
                        <span className="text-xs text-muted-foreground">{prazo.base_legal}</span>
                      )}
                    </div>
                    {prazo.descricao && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{prazo.descricao}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{total.toLocaleString('pt-BR')} prazo{total !== 1 ? 's' : ''} — Página {page + 1} de {totalPages}</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
