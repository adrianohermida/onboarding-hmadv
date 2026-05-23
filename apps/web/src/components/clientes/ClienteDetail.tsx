'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, FileText, User, Briefcase, Gavel, CheckSquare,
  Receipt, FileCheck, CreditCard, ExternalLink, ChevronDown, ChevronUp,
  Clock, CheckCircle2, AlertTriangle, Calendar, TrendingUp,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { formatDate, formatCurrency, getInitials } from '@/lib/utils';
import type { Tables } from '@/types/database';
import { WORKFLOW_STATUS_LABELS, FASE_LABELS } from '@/types';
import StatusBadge from '../ui/StatusBadge';
import FaseSelector from './FaseSelector';
import EmptyState from '../ui/EmptyState';
import { cn } from '@/lib/utils';

type Caso = Tables<'portal_casos'>;
type Doc = Pick<Tables<'portal_documentos'>, 'id' | 'tipo' | 'workflow_status' | 'direction' | 'require_signature' | 'created_at' | 'updated_at'> & { nome_arquivo: string | null };
type TimelineItem = Pick<Tables<'portal_timeline'>, 'id' | 'event_type' | 'title' | 'description' | 'created_at' | 'metadata'>;

interface Tarefa {
  id: string;
  title: string;
  status: string;
  due_date: string | null;
  created_at: string;
}

interface Custa {
  id: string;
  titulo: string | null;
  categoria: string;
  status: string;
  valor: number;
  data_vencimento: string | null;
  comprovante_url: string | null;
  created_at: string;
}

interface Contrato {
  id: string;
  titulo: string;
  tipo: string | null;
  status: string;
  assinatura_status: string | null;
  assinado_em: string | null;
  arquivo_url: string | null;
  created_at: string;
}

interface Plano {
  id: string;
  titulo: string;
  status: string;
  valor_total: number;
  parcela_sugerida: number;
  prazo_meses: number;
  cronograma: unknown;
  created_at: string;
}

interface Props {
  caso: Caso;
  docs: Doc[];
  timeline: TimelineItem[];
  tarefas: Tarefa[];
  custas: Custa[];
  contratos: Contrato[];
  planos: Plano[];
}

type Tab = 'visao_geral' | 'documentos' | 'processos' | 'financeiro' | 'tarefas' | 'timeline';

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function useProcessosCliente(_casoId: string) {
  return useQuery({
    queryKey: ['processos-cliente', _casoId],
    staleTime: 120_000,
    queryFn: async () => {
      try {
        const supabase = createClient();
        const { data } = await (supabase as any)
          .schema('judiciario')
          .from('processos')
          .select('id, numero_cnj, tribunal, grau, classe_nome, assunto_principal, orgao_julgador, data_distribuicao, data_ultima_movimentacao, valor_causa')
          .order('data_ultima_movimentacao', { ascending: false })
          .limit(20);
        return data ?? [];
      } catch {
        return [];
      }
    },
  });
}

const PRIORIDADE_CLS: Record<string, string> = {
  alta:  'bg-rose-500/10 text-rose-500',
  media: 'bg-amber-500/10 text-amber-500',
  baixa: 'bg-green-500/10 text-green-500',
};

const STATUS_CONTRATO: Record<string, { label: string; cls: string }> = {
  rascunho:            { label: 'Rascunho',           cls: 'bg-muted text-muted-foreground' },
  pendente_assinatura: { label: 'Aguard. assinatura', cls: 'bg-amber-500/10 text-amber-500' },
  assinado:            { label: 'Assinado',           cls: 'bg-green-500/10 text-green-500' },
  cancelado:           { label: 'Cancelado',          cls: 'bg-rose-500/10 text-rose-500' },
};

const STATUS_CUSTA: Record<string, string> = {
  pendente: 'bg-amber-500/10 text-amber-500',
  pago:     'bg-green-500/10 text-green-500',
  vencido:  'bg-rose-500/10 text-rose-500',
};

function grauLabel(grau: number | null) {
  if (grau === 1) return '1º Grau';
  if (grau === 2) return '2º Grau';
  if (grau === 3) return 'Superior';
  return '—';
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex justify-between items-center px-4 py-2.5 text-sm border-b border-border last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-right">{value}</dd>
    </div>
  );
}

export default function ClienteDetail({ caso, docs, timeline, tarefas, custas, contratos, planos }: Props) {
  const [tab, setTab] = useState<Tab>('visao_geral');
  const [showAll, setShowAll] = useState(false);
  const { data: processos = [], isLoading: processosLoading } = useProcessosCliente(caso.id);

  const totalCustas = custas.reduce((s, c) => s + c.valor, 0);
  const totalPlanos = planos.reduce((s, p) => s + p.valor_total, 0);
  const tarefasPendentes = tarefas.filter((t) => t.status !== 'done' && t.status !== 'cancelled' && t.status !== 'concluida' && t.status !== 'cancelada');

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'visao_geral', label: 'Visão geral' },
    { id: 'processos', label: 'Processos', count: processos.length || undefined },
    { id: 'financeiro', label: 'Financeiro' },
    { id: 'documentos', label: 'Documentos', count: docs.length || undefined },
    { id: 'tarefas', label: 'Tarefas', count: tarefasPendentes.length || undefined },
    { id: 'timeline', label: 'Timeline' },
  ];

  return (
    <div className="space-y-4 max-w-5xl">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href="/clientes" className="mt-1 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0">
              {getInitials((caso as any).full_name)}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold truncate">{(caso as any).full_name || '—'}</h1>
              <p className="text-xs text-muted-foreground">{caso.cpf || (caso as any).whatsapp || 'Sem contato'}</p>
            </div>
            <div className="flex items-center gap-2">
              <FaseSelector casoId={caso.id} userId={caso.user_id} currentFase={caso.fase} />
              <Link href={`/processos`} className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs rápidos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: 'Processos', value: processos.length, icon: Gavel, cls: 'text-violet-500', bg: 'bg-violet-500/10' },
          { label: 'Tarefas abertas', value: tarefasPendentes.length, icon: CheckSquare, cls: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Custas', value: fmt(totalCustas), icon: Receipt, cls: 'text-amber-500', bg: 'bg-amber-500/10' },
          { label: 'Honorários', value: fmt(totalPlanos), icon: CreditCard, cls: 'text-green-500', bg: 'bg-green-500/10' },
        ].map((k) => (
          <div key={k.label} className="bg-card border border-border rounded-xl p-3">
            <div className={cn('w-6 h-6 rounded-lg flex items-center justify-center mb-1.5', k.bg)}>
              <k.icon className={cn('h-3 w-3', k.cls)} />
            </div>
            <p className="text-sm font-bold tabular-nums">{k.value}</p>
            <p className="text-[10px] text-muted-foreground">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border overflow-x-auto no-scrollbar">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
              tab === t.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {t.label}
            {t.count != null && t.count > 0 && (
              <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full', tab === t.id ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Visão geral ── */}
      {tab === 'visao_geral' && (
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
              <User className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Dados pessoais</h2>
            </div>
            <dl>
              <InfoRow label="CPF" value={caso.cpf} />
              <InfoRow label="RG" value={caso.rg} />
              <InfoRow label="Telefone" value={caso.telefone} />
              <InfoRow label="Estado civil" value={caso.estado_civil} />
              <InfoRow label="Profissão" value={caso.profissao} />
              <InfoRow label="Sit. profissional" value={caso.situacao_profissional} />
              {!caso.cpf && !caso.telefone && (
                <p className="px-4 py-4 text-sm text-muted-foreground text-center">Dados não preenchidos</p>
              )}
            </dl>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Financeiro</h2>
            </div>
            <dl>
              <InfoRow label="Renda mensal" value={caso.renda_mensal ? formatCurrency(caso.renda_mensal) : null} />
              <InfoRow label="Renda familiar" value={caso.renda_familiar ? formatCurrency(caso.renda_familiar) : null} />
              <InfoRow label="Comprometimento" value={caso.comprometimento_mensal ? formatCurrency(caso.comprometimento_mensal) : null} />
              <InfoRow label="Dependentes" value={caso.numero_dependentes != null ? String(caso.numero_dependentes) : null} />
              {!caso.renda_mensal && !caso.renda_familiar && (
                <p className="px-4 py-4 text-sm text-muted-foreground text-center">Dados não preenchidos</p>
              )}
            </dl>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden lg:col-span-2">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Caso</h2>
            </div>
            <div className="grid sm:grid-cols-2">
              <dl className="border-r border-border divide-y divide-border">
                <InfoRow label="Fase" value={<StatusBadge status={caso.fase ?? 'cadastro'} labels={FASE_LABELS} />} />
                <InfoRow label="Onboarding" value={caso.onboarding_done ? 'Concluído' : `Etapa ${caso.cnj_step_atual}`} />
              </dl>
              <dl className="divide-y divide-border">
                <InfoRow label="Cadastro" value={formatDate(caso.created_at)} />
                <InfoRow label="Atualização" value={formatDate(caso.updated_at)} />
              </dl>
            </div>
            {(caso as any).observacoes && (
              <div className="px-4 py-3 border-t border-border bg-muted/20">
                <p className="text-xs text-muted-foreground mb-1">Observações</p>
                <p className="text-sm">{(caso as any).observacoes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Processos ── */}
      {tab === 'processos' && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {processosLoading ? (
            <div className="divide-y divide-border">
              {[1, 2, 3].map((i) => (
                <div key={i} className="px-4 py-4 flex gap-3 animate-pulse">
                  <div className="w-9 h-9 rounded-lg bg-muted flex-shrink-0" />
                  <div className="flex-1 space-y-2"><div className="h-3 w-48 bg-muted rounded" /><div className="h-3 w-32 bg-muted rounded" /></div>
                </div>
              ))}
            </div>
          ) : processos.length === 0 ? (
            <EmptyState icon={Gavel} title="Nenhum processo vinculado" description="Os processos jurídicos vinculados a este cliente aparecerão aqui." action={<Link href="/processos" className="text-xs text-primary hover:underline">Ver todos os processos</Link>} />
          ) : (
            <div className="divide-y divide-border">
              {processos.map((p) => (
                <div key={p.id} className="px-4 py-4 flex items-start gap-3 hover:bg-muted/30 transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Gavel className="h-4 w-4 text-violet-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-xs font-semibold">{p.numero_cnj ?? '—'}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{p.tribunal ?? '—'} · {grauLabel(p.grau)}</p>
                    {p.classe_nome && <p className="text-xs text-muted-foreground">{p.classe_nome}</p>}
                    <div className="flex items-center gap-3 mt-1.5">
                      {p.ultima_movimentacao && <span className="text-[10px] text-muted-foreground">Mov. {formatDate(p.ultima_movimentacao)}</span>}
                      {p.valor_causa && <span className="text-[10px] font-medium text-muted-foreground">{fmt(p.valor_causa)}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Financeiro ── */}
      {tab === 'financeiro' && (
        <div className="space-y-4">
          {/* Planos */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Planos de pagamento</h2>
              <Link href="/planos" className="ml-auto text-xs text-primary hover:underline">Ver todos</Link>
            </div>
            {planos.length === 0 ? (
              <EmptyState icon={CreditCard} title="Sem planos" description="Nenhum plano de pagamento para este cliente." />
            ) : (
              <div className="divide-y divide-border">
                {planos.map((p) => {
                  const cronograma = Array.isArray(p.cronograma) ? p.cronograma as { pago?: boolean }[] : [];
                  const pagas = cronograma.filter((c) => c.pago).length;
                  const pct = cronograma.length ? Math.round((pagas / cronograma.length) * 100) : 0;
                  return (
                    <div key={p.id} className="px-4 py-3.5">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium">{p.titulo}</p>
                        <span className="text-sm font-bold">{fmt(p.valor_total)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <span>{p.prazo_meses} meses</span>
                        <span>·</span>
                        <span>{fmt(p.parcela_sugerida)}/mês</span>
                        {cronograma.length > 0 && <span>· {pagas}/{cronograma.length} pagas</span>}
                      </div>
                      {cronograma.length > 0 && (
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Custas */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
              <Receipt className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Custas processuais</h2>
              <span className="ml-auto text-xs font-semibold text-foreground">{fmt(totalCustas)}</span>
            </div>
            {custas.length === 0 ? (
              <EmptyState icon={Receipt} title="Sem custas" description="Nenhuma custa registrada." />
            ) : (
              <div className="divide-y divide-border">
                {custas.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{c.titulo ?? c.categoria}</p>
                      {c.data_vencimento && <p className="text-xs text-muted-foreground">Vence {formatDate(c.data_vencimento)}</p>}
                    </div>
                    <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded', STATUS_CUSTA[c.status] ?? 'bg-muted text-muted-foreground')}>
                      {c.status}
                    </span>
                    <span className="text-sm font-semibold">{fmt(c.valor)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Contratos */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
              <FileCheck className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Contratos</h2>
            </div>
            {contratos.length === 0 ? (
              <EmptyState icon={FileCheck} title="Sem contratos" description="Nenhum contrato cadastrado." />
            ) : (
              <div className="divide-y divide-border">
                {contratos.map((c) => {
                  const cfg = STATUS_CONTRATO[c.status] ?? { label: c.status, cls: 'bg-muted text-muted-foreground' };
                  return (
                    <div key={c.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{c.titulo}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(c.created_at)}</p>
                      </div>
                      <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded', cfg.cls)}>{cfg.label}</span>
                      {c.arquivo_url && (
                        <a href={c.arquivo_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Documentos ── */}
      {tab === 'documentos' && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {docs.length === 0 ? (
            <EmptyState icon={FileText} title="Sem documentos" description="Nenhum documento enviado por este cliente." />
          ) : (
            <div className="divide-y divide-border">
              {docs.map((doc) => (
                <Link key={doc.id} href={`/documentos/${doc.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors group">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate capitalize">{doc.nome_arquivo || doc.tipo.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(doc.updated_at)}</p>
                  </div>
                  <StatusBadge status={doc.workflow_status} labels={WORKFLOW_STATUS_LABELS} />
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tarefas ── */}
      {tab === 'tarefas' && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {tarefas.length === 0 ? (
            <EmptyState icon={CheckSquare} title="Sem tarefas" description="Nenhuma tarefa vinculada a este cliente." />
          ) : (
            <div className="divide-y divide-border">
              {tarefas.map((t) => {
                const concluida = t.status === 'done' || t.status === 'concluida';
                const vencida = t.due_date && !concluida && new Date(t.due_date) < new Date();
                return (
                  <div key={t.id} className={cn('flex items-start gap-3 px-4 py-3.5 hover:bg-muted/30 transition-colors', vencida && 'bg-rose-500/5')}>
                    {concluida
                      ? <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      : vencida
                        ? <AlertTriangle className="h-4 w-4 text-rose-500 flex-shrink-0 mt-0.5" />
                        : <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />}
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm font-medium', concluida && 'line-through text-muted-foreground')}>{t.title}</p>
                      {t.due_date && (
                        <span className={cn('flex items-center gap-1 text-xs mt-0.5', vencida ? 'text-rose-500' : 'text-muted-foreground')}>
                          <Calendar className="h-3 w-3" />
                          {formatDate(t.due_date)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Timeline ── */}
      {tab === 'timeline' && (
        <div className="space-y-1">
          {timeline.length === 0 ? (
            <EmptyState icon={TrendingUp} title="Sem eventos" description="Nenhuma atividade registrada para este cliente." />
          ) : (
            <>
              {(showAll ? timeline : timeline.slice(0, 10)).map((item, i) => (
                <div key={item.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    {i < (showAll ? timeline.length : Math.min(9, timeline.length)) - 1 && (
                      <div className="w-px flex-1 bg-border mt-1" />
                    )}
                  </div>
                  <div className="pb-4 flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium">{item.title || item.event_type}</p>
                      <p className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">{formatDate(item.created_at)}</p>
                    </div>
                    {item.description && <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>}
                  </div>
                </div>
              ))}
              {timeline.length > 10 && (
                <button onClick={() => setShowAll(!showAll)} className="flex items-center gap-1 text-xs text-primary hover:underline ml-5">
                  {showAll ? <><ChevronUp className="h-3 w-3" /> Mostrar menos</> : <><ChevronDown className="h-3 w-3" /> Ver {timeline.length - 10} mais</>}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
