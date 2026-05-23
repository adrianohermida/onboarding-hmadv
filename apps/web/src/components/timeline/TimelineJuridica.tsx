'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import {
  CheckSquare, Clock, Calendar, Newspaper, Activity,
  AlertTriangle, CheckCircle2, Circle, Filter, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import EmptyState from '../ui/EmptyState';

export type TipoEvento = 'tarefa' | 'prazo' | 'audiencia' | 'publicacao' | 'movimentacao';

export interface EventoTimeline {
  id: string;
  tipo: TipoEvento;
  titulo: string;
  descricao?: string | null;
  data: string;
  urgencia?: string | null;
  status?: string | null;
  cliente?: string | null;
  processo?: string | null;
  responsavel?: string | null;
}

interface Props {
  initialEventos: EventoTimeline[];
}

// ── Tipo config ───────────────────────────────────────────────────────────────

const TIPO_CONFIG: Record<TipoEvento, {
  label: string;
  Icon: React.ElementType;
  dot: string;
  badge: string;
}> = {
  tarefa:       { label: 'Tarefas',       Icon: CheckSquare, dot: 'bg-blue-500',   badge: 'bg-blue-500/10 text-blue-600 border-blue-200' },
  prazo:        { label: 'Prazos',        Icon: Clock,       dot: 'bg-amber-500',  badge: 'bg-amber-500/10 text-amber-700 border-amber-200' },
  audiencia:    { label: 'Audiências',    Icon: Calendar,    dot: 'bg-violet-500', badge: 'bg-violet-500/10 text-violet-700 border-violet-200' },
  publicacao:   { label: 'Publicações',   Icon: Newspaper,   dot: 'bg-rose-500',   badge: 'bg-rose-500/10 text-rose-700 border-rose-200' },
  movimentacao: { label: 'Movimentações', Icon: Activity,    dot: 'bg-teal-500',   badge: 'bg-teal-500/10 text-teal-700 border-teal-200' },
};

const URGENCIA_CONFIG: Record<string, { label: string; cls: string }> = {
  critica:  { label: 'Crítica',  cls: 'bg-red-500/10 text-red-600 border-red-200' },
  urgente:  { label: 'Urgente',  cls: 'bg-orange-500/10 text-orange-600 border-orange-200' },
  alta:     { label: 'Alta',     cls: 'bg-amber-500/10 text-amber-700 border-amber-200' },
  media:    { label: 'Média',    cls: 'bg-blue-500/10 text-blue-600 border-blue-200' },
  normal:   { label: 'Normal',   cls: 'bg-gray-100 text-gray-600 border-gray-200' },
};

// ── Fetch hook ────────────────────────────────────────────────────────────────

function jud() {
  return (createClient() as any).schema('judiciario');
}

function useTimeline(initial: EventoTimeline[]) {
  const supabase = createClient();
  return useQuery<EventoTimeline[]>({
    queryKey: ['timeline-juridica'],
    queryFn: async () => {
      const desde = new Date();
      desde.setDate(desde.getDate() - 60);
      const ate = new Date();
      ate.setDate(ate.getDate() + 30);
      const desdeISO = desde.toISOString();
      const ateISO = ate.toISOString();

      const [tarefasR, prazosR, audienciasR, publicacoesR] = await Promise.all([
        supabase
          .from('re_tasks')
          .select('id, title, description, status, due_date, created_at, portal_casos!portal_caso_id(full_name)')
          .gte('due_date', desdeISO)
          .lte('due_date', ateISO)
          .order('due_date', { ascending: false })
          .limit(50),
        jud()
          .from('prazo_calculado')
          .select('id, titulo, status, prioridade, data_vencimento, processos(numero_cnj)')
          .gte('data_vencimento', desdeISO)
          .lte('data_vencimento', ateISO)
          .order('data_vencimento', { ascending: false })
          .limit(50),
        jud()
          .from('audiencias')
          .select('id, tipo, situacao, data_audiencia, local, processos(numero_cnj)')
          .gte('data_audiencia', desdeISO)
          .lte('data_audiencia', ateISO)
          .order('data_audiencia', { ascending: false })
          .limit(50),
        jud()
          .from('publicacoes')
          .select('id, conteudo, ai_urgencia, ai_tipo_ato, data_publicacao, nome_cliente, processos(numero_cnj)')
          .eq('ativo', true)
          .gte('data_publicacao', desdeISO)
          .order('data_publicacao', { ascending: false })
          .limit(30),
      ]);

      const eventos: EventoTimeline[] = [];

      for (const t of tarefasR.data ?? []) {
        eventos.push({
          id: `tarefa-${t.id}`,
          tipo: 'tarefa',
          titulo: t.title,
          descricao: t.description,
          data: t.due_date ?? t.created_at,
          urgencia: null,
          status: t.status,
          cliente: (t.portal_casos as any)?.full_name ?? null,
        });
      }

      for (const p of prazosR.data ?? []) {
        eventos.push({
          id: `prazo-${p.id}`,
          tipo: 'prazo',
          titulo: p.titulo ?? 'Prazo',
          data: p.data_vencimento,
          urgencia: p.prioridade,
          status: p.status,
          processo: (p.processos as any)?.numero_cnj ?? null,
        });
      }

      for (const a of audienciasR.data ?? []) {
        eventos.push({
          id: `audiencia-${a.id}`,
          tipo: 'audiencia',
          titulo: a.tipo ?? 'Audiência',
          descricao: a.local,
          data: a.data_audiencia,
          status: a.situacao,
          processo: (a.processos as any)?.numero_cnj ?? null,
        });
      }

      for (const pub of publicacoesR.data ?? []) {
        eventos.push({
          id: `publicacao-${pub.id}`,
          tipo: 'publicacao',
          titulo: pub.ai_tipo_ato ?? 'Publicação',
          descricao: pub.conteudo?.slice(0, 120),
          data: pub.data_publicacao,
          urgencia: pub.ai_urgencia,
          cliente: pub.nome_cliente,
          processo: (pub.processos as any)?.numero_cnj ?? null,
        });
      }

      return eventos.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
    },
    initialData: initial,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDia(iso: string) {
  const d = new Date(iso);
  const hoje = new Date();
  const ontem = new Date(hoje);
  ontem.setDate(hoje.getDate() - 1);
  const amanha = new Date(hoje);
  amanha.setDate(hoje.getDate() + 1);

  if (d.toDateString() === hoje.toDateString()) return 'Hoje';
  if (d.toDateString() === ontem.toDateString()) return 'Ontem';
  if (d.toDateString() === amanha.toDateString()) return 'Amanhã';
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
}

function fmtHora(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const h = d.getHours();
  const m = d.getMinutes();
  if (h === 0 && m === 0) return '';
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function isDayKey(iso: string) {
  return new Date(iso).toDateString();
}

function isVencido(iso: string, status: string | null | undefined) {
  if (status === 'concluida' || status === 'concluido' || status === 'realizada') return false;
  return new Date(iso) < new Date();
}

// ── Card de evento ────────────────────────────────────────────────────────────

function EventoCard({ evento }: { evento: EventoTimeline }) {
  const cfg = TIPO_CONFIG[evento.tipo];
  const urg = evento.urgencia ? URGENCIA_CONFIG[evento.urgencia] : null;
  const vencido = isVencido(evento.data, evento.status);
  const hora = fmtHora(evento.data);
  const done = ['concluida', 'concluido', 'realizada', 'cumprido'].includes(evento.status ?? '');

  return (
    <div className={cn(
      'flex gap-3 group',
      vencido && !done && 'opacity-90',
    )}>
      {/* Timeline dot + line (handled by parent) */}
      <div className="relative flex flex-col items-center flex-shrink-0 pt-1">
        <div className={cn(
          'w-2.5 h-2.5 rounded-full border-2 border-background z-10 flex-shrink-0',
          done ? 'bg-green-500' : vencido ? 'bg-red-500' : cfg.dot,
        )} />
      </div>

      {/* Card */}
      <div className={cn(
        'flex-1 mb-3 rounded-xl border bg-card transition-colors hover:border-primary/30',
        vencido && !done ? 'border-red-200 bg-red-50/30' : 'border-border',
        done && 'opacity-60',
      )}>
        <div className="px-3.5 py-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2 flex-wrap flex-1">
              <span className={cn('inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border', cfg.badge)}>
                <cfg.Icon className="h-3 w-3" />
                {cfg.label.slice(0, -1)}
              </span>
              {urg && (
                <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded border', urg.cls)}>
                  {urg.label}
                </span>
              )}
              {vencido && !done && (
                <span className="flex items-center gap-0.5 text-[10px] font-semibold text-red-600">
                  <AlertTriangle className="h-3 w-3" /> Vencido
                </span>
              )}
              {done && <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />}
            </div>
            {hora && <span className="text-[11px] text-muted-foreground flex-shrink-0">{hora}</span>}
          </div>

          {/* Título */}
          <p className={cn('text-sm font-semibold leading-snug', done && 'line-through')}>{evento.titulo}</p>

          {/* Descrição */}
          {evento.descricao && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">{evento.descricao}</p>
          )}

          {/* Meta: cliente, processo */}
          {(evento.cliente || evento.processo || evento.responsavel) && (
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {evento.cliente && (
                <span className="text-[11px] text-muted-foreground">{evento.cliente}</span>
              )}
              {evento.processo && (
                <span className="text-[11px] font-mono text-muted-foreground/70 truncate max-w-[180px]">{evento.processo}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function TimelineJuridica({ initialEventos }: Props) {
  const { data: eventos = [] } = useTimeline(initialEventos);
  const [tipoFiltro, setTipoFiltro] = useState<TipoEvento | null>(null);
  const [busca, setBusca] = useState('');

  const filtrados = useMemo(() => {
    let list = eventos;
    if (tipoFiltro) list = list.filter((e) => e.tipo === tipoFiltro);
    if (busca.trim()) {
      const q = busca.toLowerCase();
      list = list.filter((e) =>
        e.titulo.toLowerCase().includes(q) ||
        e.descricao?.toLowerCase().includes(q) ||
        e.cliente?.toLowerCase().includes(q) ||
        e.processo?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [eventos, tipoFiltro, busca]);

  // Group by day
  const agrupado = useMemo(() => {
    const map = new Map<string, { label: string; eventos: EventoTimeline[] }>();
    for (const e of filtrados) {
      const key = isDayKey(e.data);
      if (!map.has(key)) map.set(key, { label: fmtDia(e.data), eventos: [] });
      map.get(key)!.eventos.push(e);
    }
    return Array.from(map.entries());
  }, [filtrados]);

  // Counts per type
  const counts = useMemo(() => {
    const c: Record<TipoEvento, number> = { tarefa: 0, prazo: 0, audiencia: 0, publicacao: 0, movimentacao: 0 };
    for (const e of eventos) c[e.tipo]++;
    return c;
  }, [eventos]);

  return (
    <div className="flex gap-6 h-full">
      {/* Sidebar filtros */}
      <aside className="hidden lg:flex flex-col gap-3 w-48 flex-shrink-0">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide px-1">Filtrar por</p>
        <div className="space-y-1">
          <button
            onClick={() => setTipoFiltro(null)}
            className={cn(
              'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors',
              !tipoFiltro ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-foreground',
            )}
          >
            <span className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5" /> Todos
            </span>
            <span className="text-[11px] font-bold tabular-nums">{eventos.length}</span>
          </button>
          {(Object.entries(TIPO_CONFIG) as [TipoEvento, typeof TIPO_CONFIG[TipoEvento]][]).map(([tipo, cfg]) => (
            <button
              key={tipo}
              onClick={() => setTipoFiltro(tipoFiltro === tipo ? null : tipo)}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors',
                tipoFiltro === tipo ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-foreground',
              )}
            >
              <span className="flex items-center gap-2">
                <cfg.Icon className="h-3.5 w-3.5" /> {cfg.label}
              </span>
              <span className="text-[11px] tabular-nums text-muted-foreground">{counts[tipo]}</span>
            </button>
          ))}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 space-y-5">
        {/* Search + mobile filters */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar na timeline..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:bg-background transition-colors"
            />
          </div>
          {/* Mobile type chips */}
          <div className="flex gap-1 lg:hidden overflow-x-auto no-scrollbar">
            {(Object.entries(TIPO_CONFIG) as [TipoEvento, typeof TIPO_CONFIG[TipoEvento]][]).map(([tipo, cfg]) => (
              <button
                key={tipo}
                onClick={() => setTipoFiltro(tipoFiltro === tipo ? null : tipo)}
                className={cn(
                  'flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium border transition-colors',
                  tipoFiltro === tipo
                    ? cfg.badge
                    : 'border-border bg-muted text-muted-foreground',
                )}
              >
                <cfg.Icon className="h-3 w-3" />
                {cfg.label.slice(0, 4)}
              </button>
            ))}
          </div>
          {(tipoFiltro || busca) && (
            <button
              onClick={() => { setTipoFiltro(null); setBusca(''); }}
              className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Timeline */}
        {agrupado.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="Nenhum evento encontrado"
            description={tipoFiltro || busca ? 'Tente ajustar os filtros.' : 'Os eventos jurídicos aparecerão aqui.'}
          />
        ) : (
          <div className="space-y-6">
            {agrupado.map(([key, { label, eventos: evts }]) => (
              <div key={key}>
                {/* Day label */}
                <div className="flex items-center gap-3 mb-3 sticky top-0 bg-background/95 backdrop-blur-sm py-1 -mx-1 px-1 z-10">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs font-semibold text-muted-foreground capitalize px-2 py-1 rounded-full bg-muted">
                    {label}
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                {/* Events for this day */}
                <div className="relative pl-4">
                  {/* Vertical line */}
                  <div className="absolute left-1 top-1.5 bottom-1.5 w-px bg-border" />
                  {evts.map((e) => (
                    <EventoCard key={e.id} evento={e} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
