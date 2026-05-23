'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Gavel, Activity, Users, FileText, Clock, Calendar,
  Newspaper, CheckSquare, DollarSign, GitBranch, Zap,
  Eye, EyeOff, Scale, CheckCircle2, AlertTriangle,
  Plus, ExternalLink, Shield, Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useMovimentacoes, useAudiencias, usePrazos, usePartes,
  useFinanceiroProcessual, useRisco, useAtualizarProcesso,
  useCriarAudiencia, useCriarPrazoManual, useCriarFinanceiro, useAtualizarPrazo,
  usePublicacoesProcesso, useTarefasProcesso, useDocumentosProcesso,
  prazoUrgencia, URGENCIA_PRAZO_CONFIG, STATUS_PROCESSO_CONFIG, PRIORIDADE_PROCESSO_CONFIG,
  type Processo, type Audiencia, type PrazoCalculado, type FinanceiroProcessual,
} from '@/lib/hooks/use-processos';

type TabId =
  | 'movimentacoes' | 'partes' | 'documentos' | 'prazos' | 'audiencias'
  | 'publicacoes' | 'tarefas' | 'financeiro' | 'timeline' | 'acoes';

interface Props {
  processo: Processo;
  initialPartes: any[];
  clientUserIds: string[];
}

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'movimentacoes', label: 'Movimentações', icon: Activity },
  { id: 'partes',        label: 'Partes',        icon: Users },
  { id: 'documentos',   label: 'Documentos',     icon: FileText },
  { id: 'prazos',        label: 'Prazos',        icon: Clock },
  { id: 'audiencias',   label: 'Audiências',     icon: Calendar },
  { id: 'publicacoes',  label: 'Publicações',    icon: Newspaper },
  { id: 'tarefas',      label: 'Tarefas',        icon: CheckSquare },
  { id: 'financeiro',   label: 'Financeiro',     icon: DollarSign },
  { id: 'timeline',     label: 'Timeline',       icon: GitBranch },
  { id: 'acoes',        label: 'Ações',          icon: Zap },
];

// ─── Formatters ───────────────────────────────────────────────────────────────

function fmt(v: number | null | undefined) {
  if (v == null) return '—';
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      {[1, 2, 3].map(i => <div key={i} className="h-14 bg-muted rounded-xl" />)}
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return <div className="py-12 text-center text-sm text-muted-foreground">{label}</div>;
}

// ─── Form: Nova Audiência ─────────────────────────────────────────────────────

function FormNovaAudiencia({ processoId, onClose }: { processoId: string; onClose: () => void }) {
  const [tipo, setTipo] = useState('');
  const [data, setData] = useState('');
  const [local, setLocal] = useState('');
  const [obs, setObs] = useState('');
  const criar = useCriarAudiencia();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!data) return;
    await criar.mutateAsync({
      processo_id: processoId, tipo, data_audiencia: data,
      local, descricao: obs || null, situacao: 'confirmada',
    });
    onClose();
  }

  return (
    <form onSubmit={submit} className="bg-muted/30 rounded-xl p-4 space-y-3 border border-border mb-4">
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
          <label className="block text-[11px] text-muted-foreground mb-1">Data e hora *</label>
          <input required type="datetime-local" value={data} onChange={e => setData(e.target.value)}
            className="w-full px-2 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
      </div>
      <input placeholder="Local" value={local} onChange={e => setLocal(e.target.value)}
        className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring" />
      <textarea placeholder="Observações" value={obs} onChange={e => setObs(e.target.value)} rows={2}
        className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
      <div className="flex gap-2">
        <button type="button" onClick={onClose} className="flex-1 py-2 text-sm border border-border rounded-lg hover:bg-muted">Cancelar</button>
        <button type="submit" disabled={!data || criar.isPending}
          className="flex-1 py-2 text-sm bg-primary text-primary-foreground rounded-lg disabled:opacity-50">
          {criar.isPending ? 'Criando…' : 'Criar'}
        </button>
      </div>
    </form>
  );
}

// ─── Form: Novo Prazo ─────────────────────────────────────────────────────────

function FormNovoPrazo({ processoId, onClose }: { processoId: string; onClose: () => void }) {
  const [titulo, setTitulo] = useState('');
  const [vencimento, setVencimento] = useState('');
  const [prioridade, setPrioridade] = useState('media');
  const [baseLegal, setBaseLegal] = useState('');
  const criar = useCriarPrazoManual();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await criar.mutateAsync({
      processo_id: processoId, publicacao_id: null, titulo, descricao: null,
      data_vencimento: vencimento, status: 'pendente', prioridade, base_legal: baseLegal || null,
    });
    onClose();
  }

  return (
    <form onSubmit={submit} className="bg-muted/30 rounded-xl p-4 space-y-3 border border-border mb-4">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Novo prazo</p>
      <input required placeholder="Título *" value={titulo} onChange={e => setTitulo(e.target.value)}
        className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring" />
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[11px] text-muted-foreground mb-1">Vencimento *</label>
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
      <input placeholder="Base legal (art., lei…)" value={baseLegal} onChange={e => setBaseLegal(e.target.value)}
        className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring" />
      <div className="flex gap-2">
        <button type="button" onClick={onClose} className="flex-1 py-2 text-sm border border-border rounded-lg hover:bg-muted">Cancelar</button>
        <button type="submit" disabled={!titulo || !vencimento || criar.isPending}
          className="flex-1 py-2 text-sm bg-primary text-primary-foreground rounded-lg disabled:opacity-50">
          {criar.isPending ? 'Criando…' : 'Criar'}
        </button>
      </div>
    </form>
  );
}

// ─── Form: Novo Financeiro ────────────────────────────────────────────────────

function FormNovoFinanceiro({ processoId, onClose }: { processoId: string; onClose: () => void }) {
  const [tipo, setTipo] = useState('custas');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [vencimento, setVencimento] = useState('');
  const criar = useCriarFinanceiro();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await criar.mutateAsync({
      processo_id: processoId, tipo, descricao,
      valor: parseFloat(valor.replace(',', '.')),
      data_vencimento: vencimento || null, status: 'pendente', comprovante_url: null,
    });
    onClose();
  }

  return (
    <form onSubmit={submit} className="bg-muted/30 rounded-xl p-4 space-y-3 border border-border mb-4">
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
          <label className="block text-[11px] text-muted-foreground mb-1">Valor (R$) *</label>
          <input required placeholder="0,00" value={valor} onChange={e => setValor(e.target.value)}
            className="w-full px-2 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
      </div>
      <input required placeholder="Descrição *" value={descricao} onChange={e => setDescricao(e.target.value)}
        className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring" />
      <input type="date" value={vencimento} onChange={e => setVencimento(e.target.value)}
        className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring" />
      <div className="flex gap-2">
        <button type="button" onClick={onClose} className="flex-1 py-2 text-sm border border-border rounded-lg hover:bg-muted">Cancelar</button>
        <button type="submit" disabled={!descricao || !valor || criar.isPending}
          className="flex-1 py-2 text-sm bg-primary text-primary-foreground rounded-lg disabled:opacity-50">
          {criar.isPending ? 'Criando…' : 'Criar'}
        </button>
      </div>
    </form>
  );
}

// ─── Tab: Movimentações ───────────────────────────────────────────────────────

function TabMovimentacoes({ processoId }: { processoId: string }) {
  const { data: movs = [], isLoading } = useMovimentacoes(processoId);
  if (isLoading) return <Skeleton />;
  if (movs.length === 0) return <Empty label="Nenhuma movimentação registrada" />;
  return (
    <div>
      {movs.map((m, i) => (
        <div key={m.id} className="flex gap-4">
          <div className="flex flex-col items-center pt-1">
            <div className="w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-primary/10 flex-shrink-0" />
            {i < movs.length - 1 && <div className="w-px flex-1 bg-border mt-2" />}
          </div>
          <div className="pb-6 flex-1 min-w-0">
            <p className="text-[11px] text-muted-foreground mb-1">
              {fmtDateTime(m.data_movimentacao)}{m.fonte ? ` · ${m.fonte}` : ''}
            </p>
            <p className="text-sm text-foreground leading-relaxed">{m.conteudo || '—'}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Tab: Partes ──────────────────────────────────────────────────────────────

const POLO_CONFIG: Record<string, string> = {
  ativo:    'bg-blue-500/10 text-blue-500',
  passivo:  'bg-rose-500/10 text-rose-500',
  terceiro: 'bg-muted text-muted-foreground',
};

function TabPartes({ processoId }: { processoId: string }) {
  const { data: partes = [], isLoading } = usePartes(processoId);
  if (isLoading) return <Skeleton />;
  if (partes.length === 0) return <Empty label="Nenhuma parte cadastrada" />;

  const grupos = [
    { label: 'Polo ativo',   items: partes.filter(p => p.polo === 'ativo') },
    { label: 'Polo passivo', items: partes.filter(p => p.polo === 'passivo') },
    { label: 'Outros',       items: partes.filter(p => !['ativo','passivo'].includes(p.polo ?? '')) },
  ].filter(g => g.items.length > 0);

  return (
    <div className="space-y-6">
      {grupos.map(g => (
        <div key={g.label}>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            {g.label} ({g.items.length})
          </p>
          <div className="space-y-2">
            {g.items.map(p => (
              <div key={p.id} className="bg-muted/30 rounded-xl p-3 border border-border">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-medium">{p.nome}</p>
                      {p.representada_pelo_escritorio && (
                        <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-semibold">HM</span>
                      )}
                      {p.cliente_hmadv && (
                        <span className="text-[10px] bg-green-500/10 text-green-500 px-1.5 py-0.5 rounded font-semibold">Cliente</span>
                      )}
                    </div>
                    {p.tipo && <p className="text-xs text-muted-foreground mt-0.5">{p.tipo}</p>}
                    {p.documento && <p className="text-xs text-muted-foreground font-mono">{p.documento}</p>}
                    {p.advogado && <p className="text-xs text-muted-foreground">Adv.: {p.advogado}</p>}
                  </div>
                  {p.polo && (
                    <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize flex-shrink-0',
                      POLO_CONFIG[p.polo] ?? 'bg-muted text-muted-foreground')}>
                      {p.polo}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Tab: Documentos ──────────────────────────────────────────────────────────

const DOC_WORKFLOW: Record<string, { label: string; cls: string }> = {
  pendente_envio:        { label: 'Pendente envio',  cls: 'bg-muted text-muted-foreground' },
  em_analise:            { label: 'Em análise',      cls: 'bg-blue-500/10 text-blue-500' },
  aprovado:              { label: 'Aprovado',        cls: 'bg-green-500/10 text-green-500' },
  rejeitado:             { label: 'Rejeitado',       cls: 'bg-rose-500/10 text-rose-500' },
  aguardando_assinatura: { label: 'Ag. assinatura',  cls: 'bg-violet-500/10 text-violet-500' },
  assinado:              { label: 'Assinado',        cls: 'bg-teal-500/10 text-teal-500' },
  arquivado:             { label: 'Arquivado',       cls: 'bg-muted text-muted-foreground' },
};

function TabDocumentos({ clientUserIds }: { clientUserIds: string[] }) {
  const { data: docs = [], isLoading } = useDocumentosProcesso(clientUserIds);
  if (clientUserIds.length === 0) return <Empty label="Nenhum cliente identificado neste processo para exibir documentos" />;
  if (isLoading) return <Skeleton />;
  if (docs.length === 0) return <Empty label="Nenhum documento vinculado" />;

  return (
    <div className="space-y-2">
      {docs.map(doc => {
        const wfCfg = doc.workflow_status ? (DOC_WORKFLOW[doc.workflow_status] ?? null) : null;
        return (
          <div key={doc.id} className="flex items-center gap-3 bg-muted/30 rounded-xl px-4 py-3 border border-border">
            <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{doc.nome_arquivo || 'Documento'}</p>
              <p className="text-xs text-muted-foreground">{doc.tipo || '—'} · {fmtDate(doc.created_at)}</p>
            </div>
            {wfCfg && (
              <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0', wfCfg.cls)}>
                {wfCfg.label}
              </span>
            )}
            {doc.storage_path && (
              <a href={doc.storage_path} target="_blank" rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 flex-shrink-0">
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Tab: Prazos ──────────────────────────────────────────────────────────────

function TabPrazos({ processoId }: { processoId: string }) {
  const { data: prazos = [], isLoading } = usePrazos(processoId);
  const atualizar = useAtualizarPrazo();
  const [showForm, setShowForm] = useState(false);

  const urgentes = prazos.filter(p => ['vencida','hoje','semana'].includes(prazoUrgencia(p.data_vencimento)));
  const normais  = prazos.filter(p => prazoUrgencia(p.data_vencimento) === 'ok');

  function PrazoCard({ p }: { p: typeof prazos[0] }) {
    const urg = prazoUrgencia(p.data_vencimento);
    const cfg = URGENCIA_PRAZO_CONFIG[urg];
    const done = p.status === 'concluido' || p.status === 'cumprido';
    return (
      <div className={cn('bg-muted/30 rounded-xl p-3 border border-border', done && 'opacity-60')}>
        <div className="flex items-start gap-2">
          <button
            onClick={() => atualizar.mutate({ id: p.id, processoId, patch: { status: done ? 'pendente' : 'concluido' } })}
            className={cn('flex-shrink-0 mt-0.5 transition-colors', done ? 'text-green-500' : 'text-muted-foreground hover:text-primary')}>
            {done ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
          </button>
          <div className="flex-1 min-w-0">
            <p className={cn('text-sm font-medium', done && 'line-through text-muted-foreground')}>{p.titulo || '—'}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full ring-1 ring-inset', cfg.cls)}>{cfg.label}</span>
              <span className="text-xs text-muted-foreground">{fmtDate(p.data_vencimento)}</span>
              {p.base_legal && <span className="text-[11px] text-muted-foreground/60">{p.base_legal}</span>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-muted-foreground">{prazos.length} prazo{prazos.length !== 1 ? 's' : ''}</span>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 text-xs text-primary hover:underline">
          <Plus className="h-3 w-3" /> Adicionar
        </button>
      </div>
      {showForm && <FormNovoPrazo processoId={processoId} onClose={() => setShowForm(false)} />}
      {isLoading ? <Skeleton /> : prazos.length === 0 && !showForm ? <Empty label="Nenhum prazo cadastrado" /> : (
        <div className="space-y-6">
          {urgentes.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-orange-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Atenção ({urgentes.length})
              </p>
              <div className="space-y-2">{urgentes.map(p => <PrazoCard key={p.id} p={p} />)}</div>
            </div>
          )}
          {normais.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">No prazo ({normais.length})</p>
              <div className="space-y-2">{normais.map(p => <PrazoCard key={p.id} p={p} />)}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Tab: Audiências ──────────────────────────────────────────────────────────

const STATUS_AUD: Record<string, string> = {
  detectada:   'bg-blue-500/10 text-blue-500',
  confirmada:  'bg-green-500/10 text-green-500',
  realizada:   'bg-teal-500/10 text-teal-500',
  cancelada:   'bg-rose-500/10 text-rose-500',
  redesignada: 'bg-amber-500/10 text-amber-500',
};

function TabAudiencias({ processoId }: { processoId: string }) {
  const { data: aud = [], isLoading } = useAudiencias(processoId);
  const [showForm, setShowForm] = useState(false);

  const now = new Date();
  const proximas = aud.filter(a => new Date(a.data_audiencia) >= now && a.situacao !== 'cancelada');
  const passadas  = aud.filter(a => new Date(a.data_audiencia) < now || a.situacao === 'cancelada');

  function AudCard({ a, dim }: { a: typeof aud[0]; dim?: boolean }) {
    return (
      <div className={cn('bg-muted/30 rounded-xl p-3 border border-border', dim && 'opacity-60')}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{a.tipo || 'Audiência'}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{fmtDateTime(a.data_audiencia)}</p>
            {a.local && <p className="text-xs text-muted-foreground">{a.local}</p>}
            {a.descricao && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.descricao}</p>}
          </div>
          {a.situacao && (
            <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0',
              STATUS_AUD[a.situacao] ?? 'bg-muted text-muted-foreground')}>
              {a.situacao}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-muted-foreground">{aud.length} audiência{aud.length !== 1 ? 's' : ''}</span>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 text-xs text-primary hover:underline">
          <Plus className="h-3 w-3" /> Adicionar
        </button>
      </div>
      {showForm && <FormNovaAudiencia processoId={processoId} onClose={() => setShowForm(false)} />}
      {isLoading ? <Skeleton /> : aud.length === 0 && !showForm ? <Empty label="Nenhuma audiência" /> : (
        <div className="space-y-6">
          {proximas.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Próximas ({proximas.length})</p>
              <div className="space-y-2">{proximas.map(a => <AudCard key={a.id} a={a} />)}</div>
            </div>
          )}
          {passadas.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Realizadas/Canceladas ({passadas.length})</p>
              <div className="space-y-2">{passadas.map(a => <AudCard key={a.id} a={a} dim />)}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Tab: Publicações ─────────────────────────────────────────────────────────

const URGENCIA_PUB: Record<string, { label: string; cls: string }> = {
  critica: { label: 'Crítica', cls: 'bg-rose-500/10 text-rose-500' },
  alta:    { label: 'Alta',    cls: 'bg-orange-500/10 text-orange-500' },
  media:   { label: 'Média',   cls: 'bg-amber-500/10 text-amber-500' },
  normal:  { label: 'Normal',  cls: 'bg-muted text-muted-foreground' },
};

function TabPublicacoes({ processoId }: { processoId: string }) {
  const { data: pubs = [], isLoading } = usePublicacoesProcesso(processoId);
  if (isLoading) return <Skeleton />;
  if (pubs.length === 0) return <Empty label="Nenhuma publicação vinculada a este processo" />;

  return (
    <div className="space-y-3">
      {pubs.map(pub => {
        const urgCfg = pub.ai_urgencia ? (URGENCIA_PUB[pub.ai_urgencia] ?? null) : null;
        return (
          <div key={pub.id} className={cn('rounded-xl p-4 border border-border', pub.lido ? 'bg-muted/20' : 'bg-muted/40')}>
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                {!pub.lido && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                <p className="text-sm font-medium">{pub.ai_tipo_ato || 'Publicação'}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {urgCfg && (
                  <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', urgCfg.cls)}>{urgCfg.label}</span>
                )}
                <span className="text-[11px] text-muted-foreground">{fmtDate(pub.data_publicacao)}</span>
              </div>
            </div>
            {pub.conteudo && (
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{pub.conteudo}</p>
            )}
            {pub.nome_cliente && (
              <p className="text-[11px] text-muted-foreground/60 mt-2">Cliente: {pub.nome_cliente}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Tab: Tarefas ─────────────────────────────────────────────────────────────

const TAREFA_STATUS: Record<string, { label: string; cls: string }> = {
  pendente:     { label: 'Pendente',     cls: 'bg-amber-500/10 text-amber-500' },
  em_andamento: { label: 'Em andamento', cls: 'bg-blue-500/10 text-blue-500' },
  concluida:    { label: 'Concluída',    cls: 'bg-green-500/10 text-green-500' },
};

function TabTarefas({ processoId }: { processoId: string }) {
  const { data: tarefas = [], isLoading } = useTarefasProcesso(processoId);
  if (isLoading) return <Skeleton />;
  if (tarefas.length === 0) return <Empty label="Nenhuma tarefa vinculada a este processo" />;

  return (
    <div className="space-y-2">
      {tarefas.map(t => {
        const done = t.status === 'done' || t.status === 'concluida';
        const stCfg = t.status ? (TAREFA_STATUS[t.status] ?? { label: t.status, cls: 'bg-muted text-muted-foreground' }) : null;
        const vencida = t.due_date && new Date(t.due_date) < new Date() && !done;
        return (
          <div key={t.id} className={cn('bg-muted/30 rounded-xl p-3 border border-border', done && 'opacity-60')}>
            <div className="flex items-start gap-2">
              {done
                ? <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                : <Clock className="h-4 w-4 flex-shrink-0 mt-0.5 text-muted-foreground" />}
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-medium', done && 'line-through text-muted-foreground')}>{t.title}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {stCfg && <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', stCfg.cls)}>{stCfg.label}</span>}
                  {t.due_date && (
                    <span className={cn('text-xs flex items-center gap-0.5', vencida ? 'text-rose-500 font-medium' : 'text-muted-foreground')}>
                      {vencida && <AlertTriangle className="h-3 w-3" />}
                      {fmtDate(t.due_date)}
                    </span>
                  )}
                </div>
                {t.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.description}</p>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Tab: Financeiro ──────────────────────────────────────────────────────────

function TabFinanceiro({ processoId }: { processoId: string }) {
  const { data: items = [], isLoading } = useFinanceiroProcessual(processoId);
  const [showForm, setShowForm] = useState(false);

  const total   = items.reduce((s, i) => s + (i.valor ?? 0), 0);
  const pago    = items.filter(i => i.status === 'pago').reduce((s, i) => s + (i.valor ?? 0), 0);
  const pendente = items.filter(i => i.status === 'pendente').reduce((s, i) => s + (i.valor ?? 0), 0);

  const STATUS_FIN: Record<string, string> = {
    pago:     'bg-green-500/10 text-green-500',
    pendente: 'bg-amber-500/10 text-amber-500',
    vencido:  'bg-rose-500/10 text-rose-500',
  };

  return (
    <div>
      {items.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {([['Total', fmt(total), ''], ['Pago', fmt(pago), 'text-green-600'], ['Pendente', fmt(pendente), 'text-amber-600']] as const).map(([l, v, cls]) => (
            <div key={l} className="bg-muted/30 rounded-xl p-3 border border-border">
              <p className="text-[11px] text-muted-foreground">{l}</p>
              <p className={cn('text-base font-bold mt-0.5', cls)}>{v}</p>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-muted-foreground">{items.length} lançamento{items.length !== 1 ? 's' : ''}</span>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 text-xs text-primary hover:underline">
          <Plus className="h-3 w-3" /> Adicionar
        </button>
      </div>
      {showForm && <FormNovoFinanceiro processoId={processoId} onClose={() => setShowForm(false)} />}
      {isLoading ? <Skeleton /> : items.length === 0 && !showForm ? <Empty label="Nenhum lançamento financeiro" /> : (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className="flex items-center gap-3 bg-muted/30 rounded-xl px-4 py-3 border border-border">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.descricao || '—'}</p>
                <p className="text-xs text-muted-foreground">{item.tipo} · {fmtDate(item.data_vencimento)}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <p className="text-sm font-semibold">{fmt(item.valor)}</p>
                {item.status && (
                  <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full',
                    STATUS_FIN[item.status] ?? 'bg-muted text-muted-foreground')}>
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

// ─── Tab: Timeline ────────────────────────────────────────────────────────────

interface EventoWorkspace {
  id: string;
  tipo: 'movimentacao' | 'audiencia' | 'prazo' | 'publicacao' | 'financeiro';
  titulo: string;
  descricao?: string | null;
  data: string;
  status?: string | null;
}

const TIPO_TL: Record<EventoWorkspace['tipo'], { label: string; dot: string; badge: string }> = {
  movimentacao: { label: 'Mov.',       dot: 'bg-blue-400',   badge: 'bg-blue-400/20 text-blue-700 dark:text-blue-300' },
  audiencia:    { label: 'Audiência',  dot: 'bg-violet-400', badge: 'bg-violet-400/20 text-violet-700 dark:text-violet-300' },
  prazo:        { label: 'Prazo',      dot: 'bg-orange-400', badge: 'bg-orange-400/20 text-orange-700 dark:text-orange-300' },
  publicacao:   { label: 'Publicação', dot: 'bg-teal-400',   badge: 'bg-teal-400/20 text-teal-700 dark:text-teal-300' },
  financeiro:   { label: 'Financeiro', dot: 'bg-green-400',  badge: 'bg-green-400/20 text-green-700 dark:text-green-300' },
};

function TabTimeline({ processoId }: { processoId: string }) {
  const { data: movs = [],  isLoading: l1 } = useMovimentacoes(processoId);
  const { data: aud = [],   isLoading: l2 } = useAudiencias(processoId);
  const { data: prazos = [], isLoading: l3 } = usePrazos(processoId);
  const { data: pubs = [] }  = usePublicacoesProcesso(processoId);
  const { data: fin = [] }   = useFinanceiroProcessual(processoId);

  const eventos: EventoWorkspace[] = useMemo(() => {
    const list: EventoWorkspace[] = [];
    for (const m of movs)   list.push({ id: `m-${m.id}`,   tipo: 'movimentacao', titulo: m.conteudo?.slice(0, 100) || 'Movimentação', data: m.data_movimentacao, status: m.tipo });
    for (const a of aud)    list.push({ id: `a-${a.id}`,   tipo: 'audiencia',    titulo: a.tipo || 'Audiência', descricao: a.local, data: a.data_audiencia, status: a.situacao });
    for (const p of prazos) list.push({ id: `p-${p.id}`,   tipo: 'prazo',        titulo: p.titulo || 'Prazo', data: p.data_vencimento, status: p.status });
    for (const pub of pubs) list.push({ id: `pub-${pub.id}`, tipo: 'publicacao', titulo: pub.ai_tipo_ato || 'Publicação', descricao: pub.conteudo?.slice(0, 80), data: pub.data_publicacao ?? new Date().toISOString() });
    for (const f of fin)    list.push({ id: `f-${f.id}`,   tipo: 'financeiro',   titulo: [f.tipo, f.descricao].filter(Boolean).join(' — '), descricao: fmt(f.valor), data: f.created_at, status: f.status });
    return list.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [movs, aud, prazos, pubs, fin]);

  if (l1 || l2 || l3) return <Skeleton />;
  if (eventos.length === 0) return <Empty label="Nenhum evento registrado" />;

  return (
    <div>
      {eventos.map((ev, i) => {
        const cfg = TIPO_TL[ev.tipo];
        return (
          <div key={ev.id} className="flex gap-4">
            <div className="flex flex-col items-center pt-1.5">
              <div className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0 ring-4 ring-background', cfg.dot)} />
              {i < eventos.length - 1 && <div className="w-px flex-1 bg-border mt-2" />}
            </div>
            <div className="pb-4 flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded', cfg.badge)}>{cfg.label}</span>
                <span className="text-[11px] text-muted-foreground">{fmtDate(ev.data)}</span>
              </div>
              <p className="text-sm text-foreground leading-snug">{ev.titulo}</p>
              {ev.descricao && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{ev.descricao}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Tab: Ações ───────────────────────────────────────────────────────────────

const GRAU_RISCO: Record<string, { label: string; cls: string }> = {
  alto:  { label: 'Alto',  cls: 'text-rose-500 bg-rose-500/10' },
  medio: { label: 'Médio', cls: 'text-amber-500 bg-amber-500/10' },
  baixo: { label: 'Baixo', cls: 'text-green-500 bg-green-500/10' },
};

function TabAcoes({ processo }: { processo: Processo }) {
  const atualizar = useAtualizarProcesso();
  const { data: risco } = useRisco(processo.id);
  const [status, setStatus] = useState(processo.status ?? '');
  const [prioridade, setPrioridade] = useState(processo.prioridade ?? '');

  async function saveChanges() {
    await atualizar.mutateAsync({
      id: processo.id,
      patch: { status: (status || null) as any, prioridade: (prioridade || null) as any },
    });
  }

  return (
    <div className="space-y-6 max-w-xl">
      {/* Atualizar */}
      <div className="bg-muted/30 rounded-xl p-4 border border-border space-y-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Atualizar processo</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="">— sem status —</option>
              {Object.entries(STATUS_PROCESSO_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Prioridade</label>
            <select value={prioridade} onChange={e => setPrioridade(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="">— sem prioridade —</option>
              {Object.entries(PRIORIDADE_PROCESSO_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
        </div>
        <button onClick={saveChanges} disabled={atualizar.isPending}
          className="w-full py-2 text-sm bg-primary text-primary-foreground rounded-lg disabled:opacity-50 transition-opacity">
          {atualizar.isPending ? 'Salvando…' : 'Salvar alterações'}
        </button>
      </div>

      {/* Metadados */}
      <div className="bg-muted/30 rounded-xl p-4 border border-border">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Metadados</p>
        <div className="space-y-2 text-sm">
          {([
            ['Ramo do direito', processo.ramo],
            ['Órgão julgador',  processo.orgao_julgador],
            ['Ajuizamento',     fmtDate(processo.data_ajuizamento)],
            ['Registrado em',   fmtDate(processo.created_at)],
          ] as [string, string | null | undefined][]).map(([label, value]) => value && value !== '—' ? (
            <div key={label} className="flex items-baseline gap-2">
              <span className="text-muted-foreground w-36 flex-shrink-0 text-xs">{label}</span>
              <span className="text-foreground">{value}</span>
            </div>
          ) : null)}
          {processo.segredo_justica && (
            <div className="flex items-center gap-1.5 text-violet-500 mt-2">
              <Lock className="h-3.5 w-3.5" />
              <span className="text-sm font-medium">Segredo de Justiça</span>
            </div>
          )}
        </div>
      </div>

      {/* Risco */}
      {risco && (
        <div className="bg-muted/30 rounded-xl p-4 border border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5" /> Análise de risco
          </p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            {risco.grau_risco && (
              <div>
                <p className="text-[11px] text-muted-foreground mb-1">Grau</p>
                <span className={cn('text-sm font-bold px-2 py-1 rounded-lg',
                  (GRAU_RISCO[risco.grau_risco] ?? { cls: 'bg-muted text-muted-foreground' }).cls)}>
                  {(GRAU_RISCO[risco.grau_risco] ?? { label: risco.grau_risco }).label}
                </span>
              </div>
            )}
            {risco.probabilidade_sucesso != null && (
              <div>
                <p className="text-[11px] text-muted-foreground mb-1">Prob. de êxito</p>
                <p className="text-2xl font-bold">{risco.probabilidade_sucesso}%</p>
              </div>
            )}
          </div>
          {risco.descricao && (
            <p className="text-sm text-foreground leading-relaxed">{risco.descricao}</p>
          )}
          {risco.atualizado_em && (
            <p className="text-[11px] text-muted-foreground mt-2">Atualizado {fmtDate(risco.atualizado_em)}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Workspace principal ──────────────────────────────────────────────────────

export default function ProcessoWorkspace({ processo, initialPartes, clientUserIds }: Props) {
  const [tab, setTab] = useState<TabId>('movimentacoes');
  const atualizar = useAtualizarProcesso();
  const [monitorando, setMonitorando] = useState(processo.monitoramento_ativo ?? false);

  const statusCfg = processo.status ? (STATUS_PROCESSO_CONFIG[processo.status] ?? null) : null;
  const priCfg    = processo.prioridade ? (PRIORIDADE_PROCESSO_CONFIG[processo.prioridade] ?? null) : null;

  async function toggleMonitoramento() {
    const next = !monitorando;
    setMonitorando(next);
    await atualizar.mutateAsync({ id: processo.id, patch: { monitoramento_ativo: next } });
  }

  return (
    <div>
      {/* Sub-header: sticky abaixo do shell header (h-14 = top-14) */}
      <div className="sticky top-14 z-20 bg-background border-b border-border shadow-sm">
        {/* Cabeçalho do processo */}
        <div className="px-4 lg:px-6 py-4">
          <div className="flex items-start gap-3">
            <Link href="/processos"
              className="mt-1 p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0">
              <Gavel className="h-5 w-5 text-violet-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-mono text-base font-bold text-foreground">
                  {processo.numero_cnj ?? 'Sem número CNJ'}
                </h1>
                {statusCfg && (
                  <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0', statusCfg.cls)}>
                    {statusCfg.label}
                  </span>
                )}
                {priCfg && (
                  <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full ring-1 ring-inset flex-shrink-0', priCfg.cls)}>
                    {priCfg.label}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {[processo.tribunal, processo.comarca, processo.classe].filter(Boolean).join(' · ') || '—'}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {processo.valor_causa != null && (
                <span className="hidden md:flex items-center gap-1 text-xs text-muted-foreground">
                  <Scale className="h-3 w-3" /> {fmt(processo.valor_causa)}
                </span>
              )}
              <button
                onClick={toggleMonitoramento}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
                  monitorando
                    ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80',
                )}>
                {monitorando ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">{monitorando ? 'Monitorando' : 'Monitorar'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="overflow-x-auto no-scrollbar border-t border-border/50">
          <div className="flex">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0',
                  tab === t.id
                    ? 'border-primary text-primary bg-primary/5'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40',
                )}>
                <t.icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Conteúdo da aba */}
      <div className="max-w-4xl mx-auto px-4 lg:px-6 py-6">
        {tab === 'movimentacoes' && <TabMovimentacoes processoId={processo.id} />}
        {tab === 'partes'        && <TabPartes        processoId={processo.id} />}
        {tab === 'documentos'   && <TabDocumentos     clientUserIds={clientUserIds} />}
        {tab === 'prazos'        && <TabPrazos         processoId={processo.id} />}
        {tab === 'audiencias'   && <TabAudiencias     processoId={processo.id} />}
        {tab === 'publicacoes'  && <TabPublicacoes    processoId={processo.id} />}
        {tab === 'tarefas'      && <TabTarefas        processoId={processo.id} />}
        {tab === 'financeiro'   && <TabFinanceiro      processoId={processo.id} />}
        {tab === 'timeline'     && <TabTimeline       processoId={processo.id} />}
        {tab === 'acoes'        && <TabAcoes          processo={processo} />}
      </div>
    </div>
  );
}
