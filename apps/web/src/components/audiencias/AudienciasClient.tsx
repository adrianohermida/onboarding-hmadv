'use client';

import { useState, useMemo } from 'react';
import {
  Calendar, Clock, MapPin, Video, Plus, X, Search,
  CheckCircle2, AlertCircle, Circle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useAudiencias,
  useCriarAudiencia,
  useAtualizarAudiencia,
  Audiencia,
} from '@/lib/hooks/use-processos';

interface Props {
  initial: Audiencia[];
}

const SITUACAO_CONFIG: Record<string, { label: string; cls: string }> = {
  agendada:   { label: 'Agendada',   cls: 'bg-blue-500/10 text-blue-500' },
  realizada:  { label: 'Realizada',  cls: 'bg-green-500/10 text-green-500' },
  cancelada:  { label: 'Cancelada',  cls: 'bg-rose-500/10 text-rose-500' },
  adiada:     { label: 'Adiada',     cls: 'bg-amber-500/10 text-amber-500' },
  redesignada:{ label: 'Redesignada',cls: 'bg-violet-500/10 text-violet-500' },
};

const TIPO_LABELS: Record<string, string> = {
  inicial:            'Audiência Inicial',
  instrucao:          'Instrução e Julgamento',
  conciliacao:        'Conciliação',
  mediacao:           'Mediação',
  virtual:            'Virtual',
  una:                'Una',
  julgamento:         'Julgamento',
};

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }),
    time: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
  };
}

function isUpcoming(iso: string) {
  return new Date(iso) >= new Date();
}

function NovaAudienciaForm({ onClose }: { onClose: () => void }) {
  const [tipo, setTipo] = useState('');
  const [dataHora, setDataHora] = useState('');
  const [local, setLocal] = useState('');
  const [link, setLink] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const criar = useCriarAudiencia();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!dataHora) return;
    await criar.mutateAsync({
      processo_id: null,
      tipo: tipo || null,
      data_audiencia: dataHora,
      descricao: null,
      local: local || null,
      situacao: 'agendada',
      link_videoconferencia: link || null,
      observacoes: observacoes || null,
    });
    onClose();
  }

  return (
    <form onSubmit={submit} className="bg-card border border-border rounded-xl p-4 space-y-3 mb-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Nova audiência</p>
        <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] text-muted-foreground mb-1">Tipo</label>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="w-full px-2 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Selecionar</option>
            {Object.entries(TIPO_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] text-muted-foreground mb-1">Data e hora*</label>
          <input
            type="datetime-local"
            value={dataHora}
            onChange={(e) => setDataHora(e.target.value)}
            required
            className="w-full px-2 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <input
        placeholder="Local (sala, fórum...)"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
      />

      <input
        placeholder="Link de videoconferência (opcional)"
        value={link}
        onChange={(e) => setLink(e.target.value)}
        className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
      />

      <textarea
        placeholder="Observações (opcional)"
        value={observacoes}
        onChange={(e) => setObservacoes(e.target.value)}
        rows={2}
        className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring resize-none"
      />

      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onClose}
          className="flex-1 px-3 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors">
          Cancelar
        </button>
        <button type="submit" disabled={!dataHora || criar.isPending}
          className="flex-1 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors">
          {criar.isPending ? 'Criando…' : 'Criar audiência'}
        </button>
      </div>
    </form>
  );
}

export default function AudienciasClient({ initial }: Props) {
  const { data = initial } = useAudiencias();
  const atualizar = useAtualizarAudiencia();

  const [search, setSearch] = useState('');
  const [situacaoFiltro, setSituacaoFiltro] = useState<string | null>(null);
  const [abaFuturas, setAbaFuturas] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const proximas = data.filter((a) => isUpcoming(a.data_audiencia) && a.situacao !== 'cancelada');
  const passadas = data.filter((a) => !isUpcoming(a.data_audiencia) || a.situacao === 'cancelada');

  const counts = {
    proximas: proximas.length,
    passadas: passadas.length,
  };

  const filtered = useMemo(() => {
    let list = abaFuturas ? proximas : passadas;
    const q = search.toLowerCase().trim();
    if (q) list = list.filter((a) =>
      [a.tipo, a.local, a.observacoes, a.descricao].some((v) => v?.toLowerCase().includes(q))
    );
    if (situacaoFiltro) list = list.filter((a) => a.situacao === situacaoFiltro);
    return list;
  }, [data, search, situacaoFiltro, abaFuturas, proximas, passadas]);

  function marcarRealizada(a: Audiencia) {
    const nova = a.situacao === 'realizada' ? 'agendada' : 'realizada';
    atualizar.mutate({ id: a.id, processoId: a.processo_id, patch: { situacao: nova } });
  }

  return (
    <div className="space-y-5 max-w-3xl">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center mb-2">
            <Calendar className="h-3.5 w-3.5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold tabular-nums">{counts.proximas}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Próximas audiências</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="w-7 h-7 rounded-lg bg-green-500/10 flex items-center justify-center mb-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
          </div>
          <p className="text-2xl font-bold tabular-nums">{counts.passadas}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Realizadas / encerradas</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          <button
            onClick={() => setAbaFuturas(true)}
            className={cn('px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
              abaFuturas ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}
          >
            Próximas
          </button>
          <button
            onClick={() => setAbaFuturas(false)}
            className={cn('px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
              !abaFuturas ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}
          >
            Histórico
          </button>
        </div>

        <div className="relative flex-1 min-w-40">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:bg-background transition-colors"
          />
        </div>

        <select
          value={situacaoFiltro ?? ''}
          onChange={(e) => setSituacaoFiltro(e.target.value || null)}
          className="px-2.5 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Toda situação</option>
          {Object.entries(SITUACAO_CONFIG).map(([v, c]) => (
            <option key={v} value={v}>{c.label}</option>
          ))}
        </select>

        <div className="flex-1" />
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Nova audiência
        </button>
      </div>

      {showForm && <NovaAudienciaForm onClose={() => setShowForm(false)} />}

      {/* Lista */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-card border border-border rounded-xl py-10 text-center">
            <Calendar className="h-6 w-6 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {abaFuturas ? 'Nenhuma audiência futura.' : 'Nenhuma audiência no histórico.'}
            </p>
          </div>
        ) : (
          filtered.map((a) => {
            const { date, time } = formatDateTime(a.data_audiencia);
            const sitCfg = a.situacao ? SITUACAO_CONFIG[a.situacao] : null;
            const tipoLabel = a.tipo ? (TIPO_LABELS[a.tipo] ?? a.tipo) : null;
            const realizada = a.situacao === 'realizada';

            return (
              <div
                key={a.id}
                className="bg-card border border-border rounded-xl p-4 flex items-start gap-4"
              >
                {/* Data */}
                <div className="flex-shrink-0 text-center min-w-[52px]">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase leading-none">
                    {date.split(',')[0]}
                  </p>
                  <p className="text-xl font-bold text-foreground leading-tight tabular-nums">
                    {new Date(a.data_audiencia).getDate().toString().padStart(2, '0')}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(a.data_audiencia).toLocaleDateString('pt-BR', { month: 'short' })}
                  </p>
                </div>

                {/* Divider */}
                <div className="w-px bg-border self-stretch flex-shrink-0" />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {tipoLabel && <span className="text-sm font-medium text-foreground">{tipoLabel}</span>}
                    {sitCfg && (
                      <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded', sitCfg.cls)}>
                        {sitCfg.label}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />{time}
                    </span>
                    {a.local && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />{a.local}
                      </span>
                    )}
                    {a.link_videoconferencia && (
                      <a
                        href={a.link_videoconferencia}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <Video className="h-3 w-3" />
                        Acessar link
                      </a>
                    )}
                  </div>
                  {a.observacoes && (
                    <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{a.observacoes}</p>
                  )}
                </div>

                {/* Ação */}
                <button
                  onClick={() => marcarRealizada(a)}
                  className="flex-shrink-0 text-muted-foreground hover:text-primary transition-colors"
                  title={realizada ? 'Desmarcar realizada' : 'Marcar como realizada'}
                >
                  {realizada
                    ? <CheckCircle2 className="h-5 w-5 text-green-500" />
                    : <Circle className="h-5 w-5" />}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
