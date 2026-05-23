'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  X, Gavel, Calendar, DollarSign, Users, Clock, AlertTriangle,
  CheckCircle2, Plus, Scale, TrendingUp, ChevronRight, Eye, EyeOff,
  Activity, FileText, Shield, ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useMovimentacoes, useAudiencias, usePrazos, usePartes,
  useFinanceiroProcessual, useRisco, useAtualizarProcesso,
  useCriarAudiencia, useCriarPrazoManual, useCriarFinanceiro,
  prazoUrgencia, URGENCIA_PRAZO_CONFIG, STATUS_PROCESSO_CONFIG,
  type Processo, type Audiencia, type PrazoCalculado, type FinanceiroProcessual,
} from '@/lib/hooks/use-processos';

type Tab = 'movimentacoes' | 'audiencias' | 'prazos' | 'partes' | 'financeiro' | 'risco';

function fmt(v: number | null | undefined) {
  if (v == null) return '—';
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

// ─── Abas ────────────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'movimentacoes', label: 'Movimentações', icon: Activity },
  { id: 'audiencias',    label: 'Audiências',    icon: Calendar },
  { id: 'prazos',        label: 'Prazos',        icon: Clock },
  { id: 'partes',        label: 'Partes',        icon: Users },
  { id: 'financeiro',    label: 'Financeiro',    icon: DollarSign },
  { id: 'risco',         label: 'Risco',         icon: Shield },
];

// ─── Formulários de criação ──────────────────────────────────────────────────

function FormNovaAudiencia({ processoId, onClose }: { processoId: string; onClose: () => void }) {
  const [tipo, setTipo] = useState('');
  const [data, setData] = useState('');
  const [local, setLocal] = useState('');
  const [obs, setObs] = useState('');
  const criar = useCriarAudiencia();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!data) return;
    await criar.mutateAsync({ processo_id: processoId, tipo, data_audiencia: data, local, descricao: obs || null, situacao: 'confirmada' });
    onClose();
  }

  return (
    <form onSubmit={submit} className="bg-muted/30 rounded-xl p-4 space-y-3 border border-border mt-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nova audiência</p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[11px] text-muted-foreground mb-1">Tipo</label>
          <select value={tipo} onChange={e => setTipo(e.target.value)}
            className="w-full px-2 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">Selecione</option>
            {['Instrução','Conciliação','Julgamento','Oitiva','Perícia'].map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[11px] text-muted-foreground mb-1">Data e hora*</label>
          <input required type="datetime-local" value={data} onChange={e => setData(e.target.value)}
            className="w-full px-2 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
      </div>
      <input placeholder="Local (sala, endereço...)" value={local} onChange={e => setLocal(e.target.value)}
        className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring" />
      <textarea placeholder="Observações" value={obs} onChange={e => setObs(e.target.value)} rows={2}
        className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
      <div className="flex gap-2">
        <button type="button" onClick={onClose} className="flex-1 px-3 py-2 text-sm border border-border rounded-lg hover:bg-muted">Cancelar</button>
        <button type="submit" disabled={!data || criar.isPending}
          className="flex-1 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-lg disabled:opacity-50">
          {criar.isPending ? 'Criando…' : 'Criar'}
        </button>
      </div>
    </form>
  );
}

function FormNovoPrazo({ processoId, onClose }: { processoId: string; onClose: () => void }) {
  const [titulo, setTitulo] = useState('');
  const [vencimento, setVencimento] = useState('');
  const [prioridade, setPrioridade] = useState('media');
  const [baseLegal, setBaseLegal] = useState('');
  const criar = useCriarPrazoManual();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo || !vencimento) return;
    await criar.mutateAsync({ processo_id: processoId, publicacao_id: null, titulo, descricao: null, data_vencimento: vencimento, status: 'pendente', prioridade, base_legal: baseLegal || null });
    onClose();
  }

  return (
    <form onSubmit={submit} className="bg-muted/30 rounded-xl p-4 space-y-3 border border-border mt-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Novo prazo</p>
      <input required placeholder="Título do prazo*" value={titulo} onChange={e => setTitulo(e.target.value)}
        className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring" />
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[11px] text-muted-foreground mb-1">Vencimento*</label>
          <input required type="date" value={vencimento} onChange={e => setVencimento(e.target.value)}
            className="w-full px-2 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div>
          <label className="block text-[11px] text-muted-foreground mb-1">Prioridade</label>
          <select value={prioridade} onChange={e => setPrioridade(e.target.value)}
            className="w-full px-2 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring">
            {['critica','alta','media','baixa'].map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>
      <input placeholder="Base legal (art., lei...)" value={baseLegal} onChange={e => setBaseLegal(e.target.value)}
        className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring" />
      <div className="flex gap-2">
        <button type="button" onClick={onClose} className="flex-1 px-3 py-2 text-sm border border-border rounded-lg hover:bg-muted">Cancelar</button>
        <button type="submit" disabled={!titulo || !vencimento || criar.isPending}
          className="flex-1 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-lg disabled:opacity-50">
          {criar.isPending ? 'Criando…' : 'Criar'}
        </button>
      </div>
    </form>
  );
}

function FormNovoFinanceiro({ processoId, onClose }: { processoId: string; onClose: () => void }) {
  const [tipo, setTipo] = useState('custas');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [vencimento, setVencimento] = useState('');
  const criar = useCriarFinanceiro();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!descricao || !valor) return;
    await criar.mutateAsync({
      processo_id: processoId, tipo, descricao,
      valor: parseFloat(valor.replace(',', '.')),
      data_vencimento: vencimento || null,
      status: 'pendente', comprovante_url: null,
    });
    onClose();
  }

  return (
    <form onSubmit={submit} className="bg-muted/30 rounded-xl p-4 space-y-3 border border-border mt-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Novo lançamento</p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[11px] text-muted-foreground mb-1">Tipo</label>
          <select value={tipo} onChange={e => setTipo(e.target.value)}
            className="w-full px-2 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring">
            {['custas','honorarios','despesa','guia','taxa'].map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[11px] text-muted-foreground mb-1">Valor (R$)*</label>
          <input required placeholder="0,00" value={valor} onChange={e => setValor(e.target.value)}
            className="w-full px-2 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
      </div>
      <input required placeholder="Descrição*" value={descricao} onChange={e => setDescricao(e.target.value)}
        className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring" />
      <div>
        <label className="block text-[11px] text-muted-foreground mb-1">Vencimento</label>
        <input type="date" value={vencimento} onChange={e => setVencimento(e.target.value)}
          className="w-full px-2 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring" />
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={onClose} className="flex-1 px-3 py-2 text-sm border border-border rounded-lg hover:bg-muted">Cancelar</button>
        <button type="submit" disabled={!descricao || !valor || criar.isPending}
          className="flex-1 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-lg disabled:opacity-50">
          {criar.isPending ? 'Criando…' : 'Criar'}
        </button>
      </div>
    </form>
  );
}

// ─── Conteúdo das abas ───────────────────────────────────────────────────────

function TabMovimentacoes({ processoId }: { processoId: string }) {
  const { data: movs = [], isLoading } = useMovimentacoes(processoId);
  if (isLoading) return <Skeleton />;
  if (movs.length === 0) return <Vazio label="Nenhuma movimentação registrada" />;
  return (
    <div className="space-y-1">
      {movs.map((m, i) => (
        <div key={m.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
            {i < movs.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
          </div>
          <div className="pb-4 flex-1 min-w-0">
            <p className="text-xs text-muted-foreground mb-1">{fmtDateTime(m.data_movimentacao)}</p>
            <p className="text-sm text-foreground leading-snug">{m.conteudo || '—'}</p>
            {m.fonte && <p className="text-[11px] text-muted-foreground/60 mt-0.5">{m.fonte}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

function TabAudiencias({ processoId }: { processoId: string }) {
  const { data: aud = [], isLoading } = useAudiencias(processoId);
  const [showForm, setShowForm] = useState(false);

  const STATUS_AUD: Record<string, string> = {
    detectada: 'bg-blue-500/10 text-blue-500',
    confirmada: 'bg-green-500/10 text-green-500',
    realizada: 'bg-teal-500/10 text-teal-500',
    cancelada: 'bg-rose-500/10 text-rose-500',
    redesignada: 'bg-amber-500/10 text-amber-500',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-muted-foreground">{aud.length} audiência{aud.length !== 1 ? 's' : ''}</p>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 text-xs text-primary hover:underline">
          <Plus className="h-3 w-3" /> Adicionar
        </button>
      </div>
      {showForm && <FormNovaAudiencia processoId={processoId} onClose={() => setShowForm(false)} />}
      {isLoading ? <Skeleton /> : aud.length === 0 && !showForm ? <Vazio label="Nenhuma audiência marcada" /> : (
        <div className="space-y-2">
          {aud.map(a => (
            <div key={a.id} className="bg-muted/30 rounded-xl p-3 border border-border">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{a.tipo || 'Audiência'}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{fmtDateTime(a.data_audiencia)}</p>
                  {a.local && <p className="text-xs text-muted-foreground">{a.local}</p>}
                </div>
                {a.situacao && (
                  <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', STATUS_AUD[a.situacao] ?? 'bg-muted text-muted-foreground')}>
                    {a.situacao}
                  </span>
                )}
              </div>
              {a.descricao && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.descricao}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TabPrazos({ processoId }: { processoId: string }) {
  const { data: prazos = [], isLoading } = usePrazos(processoId);
  const atualizar = useAtualizarPrazo();
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-muted-foreground">{prazos.length} prazo{prazos.length !== 1 ? 's' : ''}</p>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 text-xs text-primary hover:underline">
          <Plus className="h-3 w-3" /> Adicionar
        </button>
      </div>
      {showForm && <FormNovoPrazo processoId={processoId} onClose={() => setShowForm(false)} />}
      {isLoading ? <Skeleton /> : prazos.length === 0 && !showForm ? <Vazio label="Nenhum prazo cadastrado" /> : (
        <div className="space-y-2">
          {prazos.map(p => {
            const urg = prazoUrgencia(p.data_vencimento);
            const cfg = URGENCIA_PRAZO_CONFIG[urg];
            const done = p.status === 'concluido' || p.status === 'cumprido';
            return (
              <div key={p.id} className={cn('bg-muted/30 rounded-xl p-3 border', done ? 'border-border opacity-60' : 'border-border')}>
                <div className="flex items-start gap-2">
                  <button
                    onClick={() => atualizar.mutate({ id: p.id, processoId, patch: { status: done ? 'pendente' : 'concluido' } })}
                    className={cn('flex-shrink-0 mt-0.5', done ? 'text-green-500' : 'text-muted-foreground hover:text-primary')}>
                    {done ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-medium', done && 'line-through text-muted-foreground')}>{p.titulo || '—'}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full ring-1 ring-inset', cfg.cls)}>
                        {cfg.label}
                      </span>
                      <span className="text-xs text-muted-foreground">{fmtDate(p.data_vencimento)}</span>
                      {p.base_legal && <span className="text-[11px] text-muted-foreground/60">{p.base_legal}</span>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TabPartes({ processoId }: { processoId: string }) {
  const { data: partes = [], isLoading } = usePartes(processoId);

  const POLO_CONFIG: Record<string, string> = {
    ativo: 'bg-blue-500/10 text-blue-500',
    passivo: 'bg-rose-500/10 text-rose-500',
    terceiro: 'bg-muted text-muted-foreground',
  };

  if (isLoading) return <Skeleton />;
  if (partes.length === 0) return <Vazio label="Nenhuma parte cadastrada" />;

  return (
    <div className="space-y-2">
      {partes.map(p => (
        <div key={p.id} className="bg-muted/30 rounded-xl p-3 border border-border">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium">{p.nome}</p>
                {p.representada_pelo_escritorio && (
                  <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">HM</span>
                )}
                {p.cliente_hmadv && (
                  <span className="text-[10px] bg-green-500/10 text-green-500 px-1.5 py-0.5 rounded font-medium">Cliente</span>
                )}
              </div>
              {p.documento && <p className="text-xs text-muted-foreground mt-0.5">{p.documento}</p>}
              {p.advogado && <p className="text-xs text-muted-foreground">Adv: {p.advogado}</p>}
            </div>
            {p.polo && (
              <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize', POLO_CONFIG[p.polo] ?? 'bg-muted text-muted-foreground')}>
                {p.polo}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function TabFinanceiro({ processoId }: { processoId: string }) {
  const { data: items = [], isLoading } = useFinanceiroProcessual(processoId);
  const atualizar = useAtualizarPrazo();
  const [showForm, setShowForm] = useState(false);

  const total = items.reduce((s, i) => s + (i.valor ?? 0), 0);
  const pago = items.filter(i => i.status === 'pago').reduce((s, i) => s + (i.valor ?? 0), 0);

  const STATUS_FIN: Record<string, string> = {
    pago: 'bg-green-500/10 text-green-500',
    pendente: 'bg-amber-500/10 text-amber-500',
    vencido: 'bg-rose-500/10 text-rose-500',
  };

  return (
    <div>
      {items.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          {[['Total', fmt(total)], ['Pago', fmt(pago)]].map(([l, v]) => (
            <div key={l} className="bg-muted/30 rounded-lg p-3 border border-border">
              <p className="text-[11px] text-muted-foreground">{l}</p>
              <p className="text-base font-bold mt-0.5">{v}</p>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-muted-foreground">{items.length} lançamento{items.length !== 1 ? 's' : ''}</p>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 text-xs text-primary hover:underline">
          <Plus className="h-3 w-3" /> Adicionar
        </button>
      </div>
      {showForm && <FormNovoFinanceiro processoId={processoId} onClose={() => setShowForm(false)} />}
      {isLoading ? <Skeleton /> : items.length === 0 && !showForm ? <Vazio label="Nenhum lançamento financeiro" /> : (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className="flex items-center gap-3 bg-muted/30 rounded-xl px-3 py-2.5 border border-border">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.descricao}</p>
                <p className="text-xs text-muted-foreground">{item.tipo} · {fmtDate(item.data_vencimento)}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <p className="text-sm font-semibold">{fmt(item.valor)}</p>
                {item.status && (
                  <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full', STATUS_FIN[item.status] ?? 'bg-muted text-muted-foreground')}>
                    {item.status}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TabRisco({ processoId }: { processoId: string }) {
  const { data: risco, isLoading } = useRisco(processoId);

  const GRAU_CONFIG: Record<string, { label: string; cls: string }> = {
    alto: { label: 'Alto', cls: 'text-rose-500 bg-rose-500/10' },
    medio: { label: 'Médio', cls: 'text-amber-500 bg-amber-500/10' },
    baixo: { label: 'Baixo', cls: 'text-green-500 bg-green-500/10' },
  };

  if (isLoading) return <Skeleton />;
  if (!risco) return <Vazio label="Análise de risco não disponível" />;

  const grauCfg = risco.grau_risco ? (GRAU_CONFIG[risco.grau_risco] ?? { label: risco.grau_risco, cls: 'bg-muted text-muted-foreground' }) : null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {grauCfg && (
          <div className="bg-muted/30 rounded-xl p-4 border border-border">
            <p className="text-xs text-muted-foreground mb-1">Grau de risco</p>
            <span className={cn('text-sm font-bold px-2 py-1 rounded-lg', grauCfg.cls)}>{grauCfg.label}</span>
          </div>
        )}
        {risco.probabilidade_sucesso != null && (
          <div className="bg-muted/30 rounded-xl p-4 border border-border">
            <p className="text-xs text-muted-foreground mb-1">Prob. de êxito</p>
            <p className="text-2xl font-bold">{risco.probabilidade_sucesso}%</p>
          </div>
        )}
      </div>
      {risco.descricao && (
        <div className="bg-muted/30 rounded-xl p-4 border border-border">
          <p className="text-xs font-medium text-muted-foreground mb-2">Análise</p>
          <p className="text-sm text-foreground leading-relaxed">{risco.descricao}</p>
        </div>
      )}
      {risco.atualizado_em && (
        <p className="text-[11px] text-muted-foreground text-center">Atualizado em {fmtDate(risco.atualizado_em)}</p>
      )}
    </div>
  );
}

// ─── Utilitários visuais ──────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-14 bg-muted rounded-xl" />
      ))}
    </div>
  );
}

function Vazio({ label }: { label: string }) {
  return (
    <div className="py-8 text-center text-sm text-muted-foreground">{label}</div>
  );
}

// ─── Painel principal ─────────────────────────────────────────────────────────

interface Props {
  processo: Processo;
  onClose: () => void;
  onUpdate: (id: string, patch: Partial<Pick<Processo, 'status' | 'prioridade' | 'monitoramento_ativo'>>) => void;
}

export default function ProcessoDetalhePanel({ processo: p, onClose, onUpdate }: Props) {
  const [tab, setTab] = useState<Tab>('movimentacoes');
  const atualizar = useAtualizarProcesso();

  const statusCfg = p.status ? (STATUS_PROCESSO_CONFIG[p.status] ?? { label: p.status, cls: 'bg-muted text-muted-foreground' }) : null;

  async function toggleMonitoramento() {
    await atualizar.mutateAsync({ id: p.id, patch: { monitoramento_ativo: !p.monitoramento_ativo } });
    onUpdate(p.id, { monitoramento_ativo: !p.monitoramento_ativo });
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Cabeçalho */}
      <div className="flex-shrink-0 border-b border-border">
        <div className="flex items-start gap-3 px-4 py-4">
          <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Gavel className="h-4 w-4 text-violet-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-mono text-sm font-bold text-foreground truncate">{p.numero_cnj ?? 'Sem número'}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{p.tribunal ?? '—'} · {p.comarca ?? '—'}</p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {statusCfg && (
              <span className={cn('text-[10px] font-semibold px-2 py-1 rounded-full', statusCfg.cls)}>
                {statusCfg.label}
              </span>
            )}
            <Link href={`/processos/${p.id}`}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Abrir central do processo">
              <ExternalLink className="h-4 w-4" />
            </Link>
            <button onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Info rápida */}
        <div className="px-4 pb-3 flex items-center gap-4 flex-wrap text-xs text-muted-foreground">
          {p.classe && <span className="flex items-center gap-1"><Scale className="h-3 w-3" /> {p.classe}</span>}
          {p.valor_causa != null && <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" /> {fmt(p.valor_causa)}</span>}
          {p.data_ultima_movimentacao && <span className="flex items-center gap-1"><Activity className="h-3 w-3" /> {fmtDate(p.data_ultima_movimentacao)}</span>}
          <button
            onClick={toggleMonitoramento}
            className={cn('flex items-center gap-1 ml-auto px-2 py-1 rounded-lg text-[10px] font-medium transition-colors',
              p.monitoramento_ativo ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}>
            {p.monitoramento_ativo ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
            {p.monitoramento_ativo ? 'Monitorando' : 'Monitorar'}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border-t border-border overflow-x-auto no-scrollbar">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0',
                tab === t.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              )}>
              <t.icon className="h-3 w-3" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conteúdo da aba */}
      <div className="flex-1 overflow-y-auto p-4">
        {tab === 'movimentacoes' && <TabMovimentacoes processoId={p.id} />}
        {tab === 'audiencias' && <TabAudiencias processoId={p.id} />}
        {tab === 'prazos' && <TabPrazos processoId={p.id} />}
        {tab === 'partes' && <TabPartes processoId={p.id} />}
        {tab === 'financeiro' && <TabFinanceiro processoId={p.id} />}
        {tab === 'risco' && <TabRisco processoId={p.id} />}
      </div>
    </div>
  );
}
