'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import {
  CheckSquare, Clock, AlertTriangle, Plus, X, Calendar,
  Circle, CheckCircle2, ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Tarefa {
  id: string;
  titulo: string;
  descricao: string | null;
  status: string;
  prioridade: string | null;
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

const PRIORIDADE_CONFIG: Record<string, { label: string; cls: string }> = {
  alta:  { label: 'Alta',  cls: 'bg-rose-500/10 text-rose-500 ring-rose-500/20' },
  media: { label: 'Média', cls: 'bg-amber-500/10 text-amber-500 ring-amber-500/20' },
  baixa: { label: 'Baixa', cls: 'bg-green-500/10 text-green-500 ring-green-500/20' },
};

const STATUS_LABELS: Record<string, string> = {
  pendente:     'Pendente',
  em_andamento: 'Em andamento',
  concluida:    'Concluída',
  cancelada:    'Cancelada',
};

function isOverdue(dateStr: string | null, status: string) {
  if (!dateStr) return false;
  if (status === 'concluida' || status === 'cancelada') return false;
  return new Date(dateStr) < new Date();
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function useTarefas(initial: Tarefa[]) {
  const supabase = createClient();
  return useQuery<Tarefa[]>({
    queryKey: ['tarefas'],
    queryFn: async () => {
      const { data } = await supabase
        .from('re_tarefas')
        .select('id, titulo, descricao, status, prioridade, caso_id, responsavel_id, data_vencimento, criado_em, casos(nome_cliente)')
        .order('data_vencimento', { ascending: true })
        .limit(100);
      return data ?? [];
    },
    initialData: initial,
    staleTime: 30_000,
  });
}

function useToggleStatus() {
  const qc = useQueryClient();
  const supabase = createClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const novoStatus = status === 'concluida' ? 'pendente' : 'concluida';
      await supabase.from('re_tarefas').update({ status: novoStatus }).eq('id', id);
      return novoStatus;
    },
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: ['tarefas'] });
      const prev = qc.getQueryData<Tarefa[]>(['tarefas']);
      qc.setQueryData<Tarefa[]>(['tarefas'], (old) =>
        old?.map((t) => t.id === id ? { ...t, status: status === 'concluida' ? 'pendente' : 'concluida' } : t) ?? []
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
    mutationFn: async (nova: { titulo: string; descricao?: string; prioridade: string; data_vencimento?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('re_tarefas').insert({
        titulo: nova.titulo,
        descricao: nova.descricao || null,
        prioridade: nova.prioridade,
        data_vencimento: nova.data_vencimento || null,
        responsavel_id: user?.id,
        status: 'pendente',
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tarefas'] }),
  });
}

function NovaTarefaForm({ onClose }: { onClose: () => void }) {
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [prioridade, setPrioridade] = useState('media');
  const [vencimento, setVencimento] = useState('');
  const criar = useCriarTarefa();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim()) return;
    await criar.mutateAsync({ titulo: titulo.trim(), descricao, prioridade, data_vencimento: vencimento });
    onClose();
  }

  return (
    <form onSubmit={submit} className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-semibold">Nova tarefa</p>
        <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      <input
        autoFocus
        placeholder="Título da tarefa*"
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
        required
      />

      <textarea
        placeholder="Descrição (opcional)"
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
        rows={2}
        className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring resize-none"
      />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] text-muted-foreground mb-1">Prioridade</label>
          <select
            value={prioridade}
            onChange={(e) => setPrioridade(e.target.value)}
            className="w-full px-2 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="alta">Alta</option>
            <option value="media">Média</option>
            <option value="baixa">Baixa</option>
          </select>
        </div>
        <div>
          <label className="block text-[11px] text-muted-foreground mb-1">Vencimento</label>
          <input
            type="date"
            value={vencimento}
            onChange={(e) => setVencimento(e.target.value)}
            className="w-full px-2 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onClose}
          className="flex-1 px-3 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors">
          Cancelar
        </button>
        <button type="submit" disabled={!titulo.trim() || criar.isPending}
          className="flex-1 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors">
          {criar.isPending ? 'Criando…' : 'Criar tarefa'}
        </button>
      </div>
    </form>
  );
}

export default function TarefasClient({ tarefas: initial, userId }: Props) {
  const { data: tarefas = [] } = useTarefas(initial);
  const toggle = useToggleStatus();
  const [filtro, setFiltro] = useState<string>('abertas');
  const [showForm, setShowForm] = useState(false);

  const filtered = tarefas.filter((t) => {
    if (filtro === 'abertas') return t.status === 'pendente' || t.status === 'em_andamento';
    if (filtro === 'concluidas') return t.status === 'concluida';
    return true;
  });

  const counts = {
    abertas: tarefas.filter((t) => t.status === 'pendente' || t.status === 'em_andamento').length,
    concluidas: tarefas.filter((t) => t.status === 'concluida').length,
    vencidas: tarefas.filter((t) => isOverdue(t.data_vencimento, t.status)).length,
  };

  return (
    <div className="space-y-5 max-w-2xl">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Em aberto', value: counts.abertas, icon: Clock, cls: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Vencidas',  value: counts.vencidas, icon: AlertTriangle, cls: 'text-rose-500', bg: 'bg-rose-500/10' },
          { label: 'Concluídas', value: counts.concluidas, icon: CheckCircle2, cls: 'text-green-500', bg: 'bg-green-500/10' },
        ].map((k) => (
          <div key={k.label} className="bg-card border border-border rounded-xl p-4">
            <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center mb-2', k.bg)}>
              <k.icon className={cn('h-3.5 w-3.5', k.cls)} />
            </div>
            <p className="text-2xl font-bold tabular-nums">{k.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          {([['abertas', 'Em aberto'], ['concluidas', 'Concluídas'], ['todas', 'Todas']] as const).map(([v, l]) => (
            <button
              key={v}
              onClick={() => setFiltro(v)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                filtro === v ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Nova tarefa
        </button>
      </div>

      {/* Formulário novo */}
      {showForm && <NovaTarefaForm onClose={() => setShowForm(false)} />}

      {/* Lista */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-10 text-center">
            <CheckSquare className="h-6 w-6 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {filtro === 'abertas' ? 'Nenhuma tarefa em aberto' : 'Nenhuma tarefa encontrada'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((t) => {
              const overdue = isOverdue(t.data_vencimento, t.status);
              const done = t.status === 'concluida';
              const pCfg = t.prioridade ? PRIORIDADE_CONFIG[t.prioridade] : null;
              return (
                <div
                  key={t.id}
                  className={cn(
                    'flex items-start gap-3 px-4 py-3.5 hover:bg-muted/30 transition-colors',
                    overdue && 'bg-rose-500/5',
                  )}
                >
                  {/* Toggle status */}
                  <button
                    onClick={() => toggle.mutate({ id: t.id, status: t.status })}
                    className="flex-shrink-0 mt-0.5 text-muted-foreground hover:text-primary transition-colors"
                    title={done ? 'Reabrir' : 'Marcar como concluída'}
                  >
                    {done
                      ? <CheckCircle2 className="h-5 w-5 text-green-500" />
                      : <Circle className="h-5 w-5" />}
                  </button>

                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={cn('text-sm font-medium', done && 'line-through text-muted-foreground')}>
                        {t.titulo}
                      </p>
                      {pCfg && (
                        <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded ring-1 ring-inset', pCfg.cls)}>
                          {pCfg.label}
                        </span>
                      )}
                      {overdue && (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-rose-500">
                          <AlertTriangle className="h-3 w-3" /> Vencida
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      {t.casos && (
                        <span className="text-xs text-muted-foreground">{t.casos.nome_cliente}</span>
                      )}
                      {t.data_vencimento && (
                        <span className={cn('flex items-center gap-1 text-xs', overdue ? 'text-rose-500' : 'text-muted-foreground')}>
                          <Calendar className="h-3 w-3" />
                          {formatDate(t.data_vencimento)}
                        </span>
                      )}
                    </div>
                    {t.descricao && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{t.descricao}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
