'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import {
  Calendar, Clock, MapPin, Video, User, CheckCircle2,
  AlertCircle, ChevronLeft, ChevronRight, Gavel,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import EmptyState from '../ui/EmptyState';
import KpiCard from '../ui/KpiCard';

interface Agendamento {
  id: string;
  nome: string | null;
  email: string | null;
  telefone: string | null;
  area: string | null;
  data: string;
  hora: string;
  status: string;
  observacoes: string | null;
  zoom_join_url: string | null;
  created_at: string;
}

interface Audiencia {
  id: string;
  processo_id: string | null;
  tipo: string | null;
  data_audiencia: string;
  local: string | null;
  situacao: string | null;
  link_videoconferencia: string | null;
  observacoes: string | null;
}

interface Props {
  agendamentos: Agendamento[];
  isAdmin: boolean;
}

const STATUS_AGENDAMENTO: Record<string, { label: string; cls: string }> = {
  pendente:   { label: 'Pendente',   cls: 'bg-amber-500/10 text-amber-500' },
  confirmado: { label: 'Confirmado', cls: 'bg-green-500/10 text-green-500' },
  cancelado:  { label: 'Cancelado',  cls: 'bg-rose-500/10 text-rose-500' },
  concluido:  { label: 'Concluído',  cls: 'bg-muted text-muted-foreground' },
  remarcado:  { label: 'Remarcado', cls: 'bg-blue-500/10 text-blue-500' },
};

const SITUACAO_AUDIENCIA: Record<string, { label: string; cls: string }> = {
  agendada:    { label: 'Agendada',    cls: 'bg-blue-500/10 text-blue-500' },
  realizada:   { label: 'Realizada',   cls: 'bg-green-500/10 text-green-500' },
  cancelada:   { label: 'Cancelada',   cls: 'bg-rose-500/10 text-rose-500' },
  adiada:      { label: 'Adiada',      cls: 'bg-amber-500/10 text-amber-500' },
  redesignada: { label: 'Redesignada', cls: 'bg-violet-500/10 text-violet-500' },
};

const TIPO_AUDIENCIA: Record<string, string> = {
  inicial:      'Audiência Inicial',
  instrucao:    'Instrução e Julgamento',
  conciliacao:  'Conciliação',
  mediacao:     'Mediação',
  virtual:      'Virtual',
  una:          'Una',
  julgamento:   'Julgamento',
};

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function formatData(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
}


function useAudienciasJudiciario(enabled: boolean) {
  return useQuery<Audiencia[]>({
    queryKey: ['agenda-audiencias'],
    enabled,
    staleTime: 30_000,
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await (supabase as any)
        .schema('judiciario')
        .from('audiencias')
        .select('id, processo_id, tipo, data_audiencia, local, situacao, link_videoconferencia, observacoes')
        .order('data_audiencia', { ascending: true })
        .limit(200);
      return data ?? [];
    },
  });
}

function MiniCalendario({
  ano,
  mes,
  datasComEvento,
  diaAtivo,
  onDiaClick,
  onMesAnterior,
  onProximoMes,
}: {
  ano: number;
  mes: number;
  datasComEvento: Set<string>;
  diaAtivo: string | null;
  onDiaClick: (d: string) => void;
  onMesAnterior: () => void;
  onProximoMes: () => void;
}) {
  const primeiroDia = new Date(ano, mes, 1).getDay();
  const totalDias = new Date(ano, mes + 1, 0).getDate();
  const hoje = new Date().toISOString().slice(0, 10);

  const cells: (number | null)[] = [
    ...Array(primeiroDia).fill(null),
    ...Array.from({ length: totalDias }, (_, i) => i + 1),
  ];

  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <button onClick={onMesAnterior} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="text-sm font-semibold">{MESES[mes]} {ano}</p>
        <button onClick={onProximoMes} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-px">
        {DIAS_SEMANA.map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground pb-1">{d}</div>
        ))}
        {cells.map((dia, i) => {
          if (!dia) return <div key={i} />;
          const isoDate = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
          const temEvento = datasComEvento.has(isoDate);
          const isHoje = isoDate === hoje;
          const isAtivo = isoDate === diaAtivo;

          return (
            <button
              key={i}
              onClick={() => onDiaClick(isoDate)}
              className={cn(
                'relative flex flex-col items-center justify-center h-8 w-full rounded-lg text-xs transition-colors',
                isAtivo && 'bg-primary text-primary-foreground font-semibold',
                !isAtivo && isHoje && 'bg-primary/10 text-primary font-semibold',
                !isAtivo && !isHoje && 'hover:bg-muted text-foreground',
              )}
            >
              {dia}
              {temEvento && !isAtivo && (
                <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CardAgendamento({ a }: { a: Agendamento }) {
  const cfg = STATUS_AGENDAMENTO[a.status] ?? STATUS_AGENDAMENTO.pendente;
  return (
    <div className="flex items-start gap-3 px-4 py-3.5 border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center mt-0.5">
        <User className="h-3.5 w-3.5 text-blue-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium">{a.nome ?? 'Cliente'}</p>
          <span className="text-xs text-muted-foreground tabular-nums">{a.hora?.slice(0, 5)}</span>
          <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded', cfg.cls)}>{cfg.label}</span>
        </div>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
          {a.area && <span>{a.area}</span>}
          {a.telefone && <span>{a.telefone}</span>}
          {a.email && <span>{a.email}</span>}
          {a.zoom_join_url && (
            <a href={a.zoom_join_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-primary hover:underline">
              <Video className="h-3 w-3" />Zoom
            </a>
          )}
        </div>
        {a.observacoes && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{a.observacoes}</p>}
      </div>
    </div>
  );
}

function CardAudiencia({ a }: { a: Audiencia }) {
  const dt = new Date(a.data_audiencia);
  const sitCfg = a.situacao ? (SITUACAO_AUDIENCIA[a.situacao] ?? null) : null;
  const tipoLabel = a.tipo ? (TIPO_AUDIENCIA[a.tipo] ?? a.tipo) : 'Audiência';

  return (
    <div className="flex items-start gap-4 px-4 py-4 border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
      <div className="flex-shrink-0 text-center min-w-[44px]">
        <p className="text-xl font-bold text-foreground tabular-nums leading-tight">{String(dt.getDate()).padStart(2, '0')}</p>
        <p className="text-[10px] text-muted-foreground">{dt.toLocaleDateString('pt-BR', { month: 'short' })}</p>
      </div>
      <div className="w-px bg-border self-stretch flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <p className="text-sm font-medium">{tipoLabel}</p>
          {sitCfg && <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded', sitCfg.cls)}>{sitCfg.label}</span>}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
          {a.local && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{a.local}</span>}
          {a.link_videoconferencia && (
            <a href={a.link_videoconferencia} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-primary hover:underline">
              <Video className="h-3 w-3" />Acessar link
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AgendaClient({ agendamentos, isAdmin }: Props) {
  const hoje = new Date();
  const [calAno, setCalAno] = useState(hoje.getFullYear());
  const [calMes, setCalMes] = useState(hoje.getMonth());
  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(hoje.toISOString().slice(0, 10));
  const [aba, setAba] = useState<'audiencias' | 'agendamentos'>('audiencias');

  const { data: audiencias = [] } = useAudienciasJudiciario(isAdmin);

  const datasComAudiencia = useMemo(() => {
    const s = new Set<string>();
    audiencias.forEach((a) => s.add(a.data_audiencia.slice(0, 10)));
    agendamentos.forEach((a) => s.add(a.data));
    return s;
  }, [audiencias, agendamentos]);

  const audienciasFiltradas = useMemo(() => {
    if (!diaSelecionado) return audiencias;
    return audiencias.filter((a) => a.data_audiencia.slice(0, 10) === diaSelecionado);
  }, [audiencias, diaSelecionado]);

  const agendamentosDia = useMemo(() => {
    if (!diaSelecionado) return agendamentos;
    return agendamentos.filter((a) => a.data === diaSelecionado);
  }, [agendamentos, diaSelecionado]);

  const proximas = audiencias.filter((a) => new Date(a.data_audiencia) >= new Date() && a.situacao !== 'cancelada');
  const pendentes = agendamentos.filter((a) => a.status === 'pendente').length;

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <KpiCard label="Próximas audiências" value={proximas.length} icon={Gavel} iconCls="text-violet-500" bgCls="bg-violet-500/10" />
        <KpiCard label="Agendamentos pendentes" value={pendentes} icon={AlertCircle} iconCls="text-amber-500" bgCls="bg-amber-500/10" />
        <KpiCard label="Total confirmados" value={agendamentos.filter((a) => a.status === 'confirmado').length} icon={CheckCircle2} iconCls="text-green-500" bgCls="bg-green-500/10" />
      </div>

      <div className="grid lg:grid-cols-[280px,1fr] gap-5">
        {/* Calendário lateral */}
        <div className="space-y-4">
          <MiniCalendario
            ano={calAno}
            mes={calMes}
            datasComEvento={datasComAudiencia}
            diaAtivo={diaSelecionado}
            onDiaClick={(d) => setDiaSelecionado(diaSelecionado === d ? null : d)}
            onMesAnterior={() => {
              if (calMes === 0) { setCalMes(11); setCalAno((y) => y - 1); }
              else setCalMes((m) => m - 1);
            }}
            onProximoMes={() => {
              if (calMes === 11) { setCalMes(0); setCalAno((y) => y + 1); }
              else setCalMes((m) => m + 1);
            }}
          />

          {diaSelecionado && (
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                {new Date(diaSelecionado + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
              </p>
              <div className="space-y-1.5">
                {agendamentosDia.length === 0 && audienciasFiltradas.length === 0 && (
                  <p className="text-xs text-muted-foreground">Nenhum evento neste dia.</p>
                )}
                {audienciasFiltradas.slice(0, 3).map((a) => (
                  <div key={a.id} className="flex items-center gap-2 text-xs">
                    <Gavel className="h-3 w-3 text-violet-500 flex-shrink-0" />
                    <span className="text-muted-foreground">{new Date(a.data_audiencia).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="truncate">{a.tipo ? (TIPO_AUDIENCIA[a.tipo] ?? a.tipo) : 'Audiência'}</span>
                  </div>
                ))}
                {agendamentosDia.slice(0, 3).map((a) => (
                  <div key={a.id} className="flex items-center gap-2 text-xs">
                    <div className={cn('w-2 h-2 rounded-full flex-shrink-0', a.status === 'confirmado' ? 'bg-green-500' : 'bg-amber-500')} />
                    <span className="text-muted-foreground">{a.hora?.slice(0, 5)}</span>
                    <span className="truncate">{a.nome ?? 'Cliente'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Conteúdo principal */}
        <div className="space-y-4">
          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-muted rounded-xl w-fit">
            {[
              { id: 'audiencias' as const, label: `Audiências${audiencias.length ? ` (${audiencias.length})` : ''}` },
              { id: 'agendamentos' as const, label: `Agendamentos (${agendamentos.length})` },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setAba(t.id)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  aba === t.id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {aba === 'audiencias' && (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {diaSelecionado ? formatData(diaSelecionado) : 'Todas as audiências'}
                </p>
                {diaSelecionado && (
                  <button onClick={() => setDiaSelecionado(null)} className="text-xs text-primary hover:underline">
                    Ver todas
                  </button>
                )}
              </div>
              {audienciasFiltradas.length === 0 ? (
                <EmptyState icon={Gavel} title="Nenhuma audiência" description={diaSelecionado ? "Sem audiências neste dia." : "Nenhuma audiência cadastrada."} />
              ) : (
                audienciasFiltradas.map((a) => <CardAudiencia key={a.id} a={a} />)
              )}
            </div>
          )}

          {aba === 'agendamentos' && (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-muted/30">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {diaSelecionado ? formatData(diaSelecionado) : 'Todos os agendamentos'}
                </p>
              </div>
              {agendamentosDia.length === 0 ? (
                <EmptyState icon={User} title="Nenhum agendamento" description={diaSelecionado ? "Sem agendamentos neste dia." : "Nenhum agendamento encontrado."} />
              ) : (
                agendamentosDia.map((a) => <CardAgendamento key={a.id} a={a} />)
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
