'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import {
  CheckSquare, Clock, AlertTriangle, Plus, X, Calendar,
  Circle, CheckCircle2, List, LayoutGrid, Loader2,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import EmptyState from '../ui/EmptyState';
import { useDebounce } from '@/lib/hooks/use-global-search';

const TAREFAS_PAGE_SIZE = 30;

interface Tarefa {
  id: string;
  titulo: string;
  descricao: string | null;
  status: string;
  prioridade: string | null;
  tipo: string | null;
  caso_id: string | null;
  responsavel_id: string | null;
  data_vencimento: string | null;
  criado_em: string;
  casos: { nome_cliente: string } | null;
}

interface Props {
  tarefas: Tarefa[];
  userId: string;
}

// ── Config ────────────────────────────────────────────────────────────────────

const PRIORIDADE_CONFIG: Record<string, { label: string; cls: string }> = {
  critica: { label: 'Crítica', cls: 'bg-red-500/10 text-red-600 ring-red-400/30' },
  alta:    { label: 'Alta',    cls: 'bg-rose-500/10 text-rose-500 ring-rose-400/30' },
  media:   { label: 'Média',  cls: 'bg-amber-500/10 text-amber-600 ring-amber-400/30' },
  baixa:   { label: 'Baixa',  cls: 'bg-green-500/10 text-green-600 ring-green-400/30' },
};

const TIPO_CONFIG: Record<string, { label: string; cls: string }> = {
  processual:     { label: 'Processual',  cls: 'bg-violet-500/10 text-violet-600' },
  administrativo: { label: 'Adm.',        cls: 'bg-blue-500/10 text-blue-600' },
  financeiro:     { label: 'Financeiro',  cls: 'bg-green-500/10 text-green-700' },
  cliente:        { label: 'Cliente',     cls: 'bg-teal-500/10 text-teal-700' },
  audiencia:      { label: 'Audiência',   cls: 'bg-orange-500/10 text-orange-700' },
  diligencia:     { label: 'Diligência',  cls: 'bg-slate-500/10 text-slate-700' },
};

const KANBAN_COLS: { status: string; label: string; headerCls: string }[] = [
  { status: 'pendente',     label: 'Pendente',     headerCls: 'border-amber-300 bg-amber-50 text-amber-800' },
  { status: 'em_andamento', label: 'Em andamento', headerCls: 'border-blue-300 bg-blue-50 text-blue-800' },
  { status: 'concluida',    label: 'Concluída',    headerCls: 'border-green-300 bg-green-50 text-green-800' },
];

// ── Utils ─────────────────────────────────────────────────────────────────────

function isOverdue(dateStr: string | null, status: string) {
  if (!dateStr || status === 'concluida' || status === 'cancelada') return false;
  return new Date(dateStr) < new Date();
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function diasAtraso(iso: string | null) {
  if (!iso) return null;
  return Math.ceil((Date.now() - new Date(iso).getTime()) / 86400000);
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

interface TarefasFiltros {
  status: 'abertas' | 'concluidas' | 'todas';
  prioridade: string;
  search: string;
}

interface TarefasPaginadas {
  data: Tarefa[];
  total: number;
}

function useTarefasPaginadas(filtros: TarefasFiltros, page: number) {
  const supabase = createClient();
  return useQuery<TarefasPaginadas>({
    queryKey: ['tarefas-paginadas', filtros, page],
    staleTime: 30_000,
    queryFn: async () => {
      const from = page * TAREFAS_PAGE_SIZE;
      const to = from + TAREFAS_PAGE_SIZE - 1;

      let q = supabase
        .from('re_tarefas')
        .select('id, titulo, descricao, status, prioridade, tipo, caso_id, responsavel_id, data_vencimento, criado_em, casos(nome_cliente)', { count: 'exact' })
        .order('data_vencimento', { ascending: true })
        .range(from, to);

      if (filtros.status === 'abertas') q = q.in('status', ['pendente', 'em_andamento']);
      else if (filtros.status === 'concluidas') q = q.eq('status', 'concluida');
      if (filtros.prioridade) q = q.eq('prioridade', filtros.prioridade);
      if (filtros.search.trim().length >= 2) q = q.ilike('titulo', `%${filtros.search.trim()}%`);

      const { data, count, error } = await q;
      if (error) throw error;
      return { data: (data ?? []) as Tarefa[], total: count ?? 0 };
    },
  });
}

function useTarefasContagens() {
  const supabase = createClient();
  return useQuery({
    queryKey: ['tarefas-contagens'],
    staleTime: 60_000,
    queryFn: async () => {
      const [abertas, concluidas, vencidas, criticas] = await Promise.all([
        supabase.from('re_tarefas').select('id', { count: 'exact', head: true }).in('status', ['pendente', 'em_andamento']),
        supabase.from('re_tarefas').select('id', { count: 'exact', head: true }).eq('status', 'concluida'),
        supabase.from('re_tarefas').select('id', { count: 'exact', head: true }).in('status', ['pendente', 'em_andamento']).lt('data_vencimento', new Date().toISOString()),
        supabase.from('re_tarefas').select('id', { count: 'exact', head: true }).eq('prioridade', 'critica').not('status', 'eq', 'concluida'),
      ]);
      return {
        abertas:    abertas.count ?? 0,
        concluidas: concluidas.count ?? 0,
        vencidas:   vencidas.count ?? 0,
        criticas:   criticas.count ?? 0,
      };
    },
  });
}

function useAtualizarStatus() {
  const qc = useQueryClient();
  const supabase = createClient();
  return useMutation({
    mutationFn: async ({ id, novoStatus }: { id: string; novoStatus: string }) => {
      await supabase.from('re_tarefas').update({ status: novoStatus }).eq('id', id);
    },
    onMutate: async ({ id, novoStatus }) => {
      await qc.cancelQueries({ queryKey: ['tarefas'] });
      const prev = qc.getQueryData<Tarefa[]>(['tarefas']);
      qc.setQueryData<Tarefa[]>(['tarefas'], (old) =>
        old?.map((t) => t.id === id ? { ...t, status: novoStatus } : t) ?? []
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['tarefas'], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['tarefas'] }),
  });
}

function useCriarTarefa() {
  const qc = useQueryClient();
  const supabase = createClient();
  return useMutation({
    mutationFn: async (nova: {
      titulo: string; descricao?: string; prioridade: string;
      tipo?: string; data_vencimento?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('re_tarefas').insert({
        titulo: nova.titulo,
        descricao: nova.descricao || null,
        prioridade: nova.prioridade,
        tipo: nova.tipo || null,
        data_vencimento: nova.data_vencimento || null,
        responsavel_id: user?.id,
        status: 'pendente',
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tarefas'] }),
  });
}

// ── NovaTarefaForm ────────────────────────────────────────────────────────────

function NovaTarefaForm({ onClose }: { onClose: () => void }) {
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [prioridade, setPrioridade] = useState('media');
  const [tipo, setTipo] = useState('');
  const [vencimento, setVencimento] = useState('');
  const criar = useCriarTarefa();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim()) return;
    await criar.mutateAsync({ titulo: titulo.trim(), descricao, prioridade, tipo, data_vencimento: vencimento });
    onClose();
  }

  return (
    <form onSubmit={submit} className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-semibold">Nova tarefa</p>
        <button type="button" onClick={onClose}
          className="p-1 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>
      <input
        autoFocus required
        placeholder="Título da tarefa *"
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <textarea
        placeholder="Descrição (opcional)"
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
        rows={2}
        className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring resize-none"
      />
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="block text-[11px] text-muted-foreground mb-1">Prioridade</label>
          <select value={prioridade} onChange={(e) => setPrioridade(e.target.value)}
            className="w-full px-2 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="critica">Crítica</option>
            <option value="alta">Alta</option>
            <option value="media">Média</option>
            <option value="baixa">Baixa</option>
          </select>
        </div>
        <div>
          <label className="block text-[11px] text-muted-foreground mb-1">Tipo</label>
          <select value={tipo} onChange={(e) => setTipo(e.target.value)}
            className="w-full px-2 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">Geral</option>
            {Object.entries(TIPO_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[11px] text-muted-foreground mb-1">Vencimento</label>
          <input type="date" value={vencimento} onChange={(e) => setVencimento(e.target.value)}
            className="w-full px-2 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onClose}
          className="flex-1 px-3 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors">
          Cancelar
        </button>
        <button type="submit" disabled={!titulo.trim() || criar.isPending}
          className="flex-1 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
          {criar.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {criar.isPending ? 'Criando…' : 'Criar tarefa'}
        </button>
      </div>
    </form>
  );
}

// ── TarefaCard ────────────────────────────────────────────────────────────────

function TarefaCard({
  tarefa, compact = false, onToggle, onMover,
}: {
  tarefa: Tarefa; compact?: boolean;
  onToggle: () => void;
  onMover?: (novoStatus: string) => void;
}) {
  const overdue = isOverdue(tarefa.data_vencimento, tarefa.status);
  const done = tarefa.status === 'concluida';
  const atraso = overdue ? diasAtraso(tarefa.data_vencimento) : null;
  const pCfg = tarefa.prioridade ? PRIORIDADE_CONFIG[tarefa.prioridade] : null;
  const tipoCfg = tarefa.tipo ? TIPO_CONFIG[tarefa.tipo] : null;

  return (
    <div className={cn(
      'rounded-xl border bg-card transition-all',
      overdue && !done ? 'border-rose-300 bg-rose-50/30' : 'border-border hover:border-primary/30',
      done && 'opacity-60',
      compact ? 'p-3' : 'p-4',
    )}>
      <div className="flex items-start gap-2.5">
        <button
          onClick={onToggle}
          className={cn('flex-shrink-0 mt-0.5 transition-colors',
            done ? 'text-green-500' : overdue ? 'text-rose-500' : 'text-muted-foreground hover:text-primary')}
        >
          {done ? <CheckCircle2 className="h-5 w-5" />
            : overdue ? <AlertTriangle className="h-5 w-5" />
            : <Circle className="h-5 w-5" />}
        </button>

        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-medium leading-snug', done && 'line-through text-muted-foreground')}>
            {tarefa.titulo}
          </p>

          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {pCfg && (
              <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded ring-1 ring-inset', pCfg.cls)}>
                {pCfg.label}
              </span>
            )}
            {tipoCfg && (
              <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded', tipoCfg.cls)}>
                {tipoCfg.label}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            {tarefa.casos?.nome_cliente && (
              <span className="text-[11px] text-muted-foreground truncate max-w-[150px]">
                {tarefa.casos.nome_cliente}
              </span>
            )}
            {tarefa.data_vencimento && (
              <span className={cn('flex items-center gap-1 text-[11px]',
                overdue && !done ? 'text-rose-500 font-medium' : 'text-muted-foreground')}>
                <Calendar className="h-3 w-3" />
                {overdue && !done && atraso
                  ? `Venceu ${atraso}d atrás`
                  : formatDate(tarefa.data_vencimento)}
              </span>
            )}
          </div>

          {!compact && tarefa.descricao && (
            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
              {tarefa.descricao}
            </p>
          )}
        </div>
      </div>

      {onMover && !done && (
        <div className="flex gap-1 mt-2.5 pt-2 border-t border-border/60">
          {KANBAN_COLS.filter((c) => c.status !== tarefa.status && c.status !== 'concluida').map((col) => (
            <button
              key={col.status}
              onClick={() => onMover(col.status)}
              className="flex-1 text-[10px] text-muted-foreground hover:text-foreground py-1 rounded-lg hover:bg-muted transition-colors text-center"
            >
              → {col.label}
            </button>
          ))}
          <button
            onClick={() => onMover('concluida')}
            className="flex-1 text-[10px] text-green-600 py-1 rounded-lg hover:bg-green-50 transition-colors text-center"
          >
            ✓ Concluir
          </button>
        </div>
      )}
    </div>
  );
}

// ── Kanban ────────────────────────────────────────────────────────────────────

function KanbanView({ tarefas, onToggle, onMover }: {
  tarefas: Tarefa[];
  onToggle: (t: Tarefa) => void;
  onMover: (id: string, status: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {KANBAN_COLS.map((col) => {
        const colTarefas = tarefas.filter((t) => t.status === col.status);
        return (
          <div key={col.status} className="flex flex-col">
            <div className={cn(
              'flex items-center justify-between px-3 py-2.5 rounded-xl border mb-3',
              col.headerCls,
            )}>
              <span className="text-xs font-semibold">{col.label}</span>
              <span className="text-xs font-bold tabular-nums">{colTarefas.length}</span>
            </div>
            <div className="space-y-2">
              {colTarefas.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border py-8 text-center">
                  <p className="text-xs text-muted-foreground">Sem tarefas</p>
                </div>
              ) : (
                colTarefas.map((t) => (
                  <TarefaCard
                    key={t.id}
                    tarefa={t}
                    compact
                    onToggle={() => onToggle(t)}
                    onMover={(novoStatus) => onMover(t.id, novoStatus)}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

type ViewMode = 'lista' | 'kanban';

export default function TarefasClient({ userId: _userId }: { tarefas?: Tarefa[]; userId: string }) {
  const atualizar = useAtualizarStatus();
  const [view, setView] = useState<ViewMode>('lista');
  const [statusFiltro, setStatusFiltro] = useState<'abertas' | 'concluidas' | 'todas'>('abertas');
  const [prioridadeFiltro, setPrioridadeFiltro] = useState('');
  const [rawSearch, setRawSearch] = useState('');
  const [page, setPage] = useState(0);
  const [showForm, setShowForm] = useState(false);

  const debouncedSearch = useDebounce(rawSearch, 350);

  const filtros: TarefasFiltros = { status: statusFiltro, prioridade: prioridadeFiltro, search: debouncedSearch };
  const { data: result, isFetching } = useTarefasPaginadas(filtros, page);
  const { data: counts = { abertas: 0, concluidas: 0, vencidas: 0, criticas: 0 } } = useTarefasContagens();

  const tarefas = result?.data ?? [];
  const total = result?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / TAREFAS_PAGE_SIZE));

  function handleStatusChange(v: 'abertas' | 'concluidas' | 'todas') {
    setStatusFiltro(v);
    setPage(0);
  }

  function handleToggle(t: Tarefa) {
    atualizar.mutate({ id: t.id, novoStatus: t.status === 'concluida' ? 'pendente' : 'concluida' });
  }

  function handleMover(id: string, novoStatus: string) {
    atualizar.mutate({ id, novoStatus });
  }

  return (
    <div className="flex flex-col gap-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Em aberto',  value: counts.abertas,    Icon: Clock,         dot: 'bg-blue-500/10',   icn: 'text-blue-500' },
          { label: 'Vencidas',   value: counts.vencidas,   Icon: AlertTriangle, dot: 'bg-rose-500/10',   icn: 'text-rose-500' },
          { label: 'Críticas',   value: counts.criticas,   Icon: AlertTriangle, dot: 'bg-orange-500/10', icn: 'text-orange-500' },
          { label: 'Concluídas', value: counts.concluidas, Icon: CheckCircle2,  dot: 'bg-green-500/10',  icn: 'text-green-500' },
        ].map((k) => (
          <div key={k.label} className="bg-card border border-border rounded-xl p-4">
            <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center mb-2', k.dot)}>
              <k.Icon className={cn('h-3.5 w-3.5', k.icn)} />
            </div>
            <p className="text-2xl font-bold tabular-nums">{k.value.toLocaleString('pt-BR')}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Search */}
        <div className="relative min-w-44">
          <CheckSquare className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar título..."
            value={rawSearch}
            onChange={(e) => { setRawSearch(e.target.value); setPage(0); }}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:bg-background transition-colors"
          />
        </div>

        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          {([['abertas', 'Em aberto'], ['concluidas', 'Concluídas'], ['todas', 'Todas']] as const).map(([v, l]) => (
            <button
              key={v}
              onClick={() => handleStatusChange(v)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                statusFiltro === v ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {l}
            </button>
          ))}
        </div>

        <select
          value={prioridadeFiltro}
          onChange={(e) => { setPrioridadeFiltro(e.target.value); setPage(0); }}
          className="px-2.5 py-1.5 text-xs bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Toda prioridade</option>
          {Object.entries(PRIORIDADE_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>

        <div className="flex items-center gap-2 ml-auto">
          {isFetching && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
          <span className="text-xs text-muted-foreground">{total.toLocaleString('pt-BR')} tarefa{total !== 1 ? 's' : ''}</span>
        </div>

        {/* View toggle */}
        <div className="flex gap-0.5 p-1 bg-muted rounded-lg">
          <button onClick={() => setView('lista')} title="Lista"
            className={cn('p-1.5 rounded-md transition-colors', view === 'lista' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}>
            <List className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => setView('kanban')} title="Kanban"
            className={cn('p-1.5 rounded-md transition-colors', view === 'kanban' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}>
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" /> Nova tarefa
        </button>
      </div>

      {showForm && <NovaTarefaForm onClose={() => setShowForm(false)} />}

      {/* Views */}
      {view === 'kanban' ? (
        <KanbanView tarefas={tarefas} onToggle={handleToggle} onMover={handleMover} />
      ) : (
        tarefas.length === 0 && !isFetching ? (
          <EmptyState
            icon={CheckSquare}
            title="Nenhuma tarefa encontrada"
            description={statusFiltro === 'abertas' ? 'Nenhuma tarefa em aberto.' : 'Nenhuma tarefa encontrada.'}
          />
        ) : (
          <div className="space-y-2">
            {tarefas.map((t) => (
              <TarefaCard key={t.id} tarefa={t} onToggle={() => handleToggle(t)} />
            ))}
          </div>
        )
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0 || isFetching}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Anterior
          </button>
          <span className="text-xs text-muted-foreground">Página {page + 1} de {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1 || isFetching}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            Próxima <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
