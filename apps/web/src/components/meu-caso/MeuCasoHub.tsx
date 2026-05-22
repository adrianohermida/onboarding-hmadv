'use client';

import { useState } from 'react';
import {
  Scale, FileText, CreditCard, Gavel, Clock,
  CheckCircle2, AlertCircle, Circle, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FASE_LABELS } from '@/types';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Caso {
  id: string;
  fase: string | null;
  cnj_step_atual: number | null;
  nome_cliente: string | null;
  status: string | null;
  created_at: string;
}

interface Documento {
  id: string;
  nome: string;
  workflow_status: string;
  tipo: string | null;
}

interface Plano {
  id: string;
  status: string;
  valor_total: number | null;
  total_parcelas: number | null;
  parcelas_pagas: number | null;
  data_inicio: string | null;
}

interface Processo {
  id: string;
  numero_cnj: string | null;
  tribunal: string | null;
  classe: string | null;
  status: string | null;
  data_ultima_movimentacao: string | null;
}

interface Prazo {
  id: string;
  descricao: string;
  data_prazo: string;
  tipo: string | null;
  urgente: boolean | null;
  cumprido: boolean | null;
}

interface Props {
  caso: Caso | null;
  documentos: Documento[];
  plano: Plano | null;
  processos: Processo[];
  prazos: Prazo[];
}

// ── Steps ─────────────────────────────────────────────────────────────────────

const ONBOARDING_STEPS = [
  'Dados pessoais',
  'Endereço',
  'Situação profissional',
  'Dívidas',
  'Documentos',
  'Revisão',
];

// ── Tabs ──────────────────────────────────────────────────────────────────────

type Tab = 'visao_geral' | 'processos' | 'plano' | 'documentos' | 'prazos';

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'visao_geral', label: 'Visão Geral', icon: Scale },
  { id: 'processos',   label: 'Processos',   icon: Gavel },
  { id: 'plano',       label: 'Plano',       icon: CreditCard },
  { id: 'documentos',  label: 'Documentos',  icon: FileText },
  { id: 'prazos',      label: 'Prazos',      icon: Clock },
];

// ── Utils ─────────────────────────────────────────────────────────────────────

function fmt(v: number | null | undefined) {
  if (!v) return '—';
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR');
}

// ── Sub-views ─────────────────────────────────────────────────────────────────

function VisaoGeral({ caso, documentos, plano }: Pick<Props, 'caso' | 'documentos' | 'plano'>) {
  const step = caso?.cnj_step_atual ?? 0;
  const pct = Math.round((step / ONBOARDING_STEPS.length) * 100);
  const docsPendentes = documentos.filter((d) =>
    d.workflow_status === 'pendente_envio' || d.workflow_status === 'pendente_correcao',
  ).length;

  return (
    <div className="space-y-6">
      {/* Onboarding progress */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Progresso do cadastro</h3>
          <span className="text-sm font-bold text-primary">{pct}%</span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {ONBOARDING_STEPS.map((label, i) => {
            const done = i < step;
            const current = i === step;
            return (
              <div key={label} className="flex flex-col items-center gap-1">
                {done
                  ? <CheckCircle2 className="h-5 w-5 text-green-500" />
                  : current
                    ? <AlertCircle className="h-5 w-5 text-primary" />
                    : <Circle className="h-5 w-5 text-muted-foreground/30" />}
                <span className={cn(
                  'text-[10px] text-center leading-tight',
                  done ? 'text-green-600' : current ? 'text-primary' : 'text-muted-foreground/50',
                )}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border bg-card p-4 space-y-1">
          <p className="text-[11px] text-muted-foreground font-medium">Fase</p>
          <p className="text-sm font-semibold">{caso?.fase ? (FASE_LABELS as Record<string, string>)[caso.fase] ?? caso.fase : '—'}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 space-y-1">
          <p className="text-[11px] text-muted-foreground font-medium">Documentos pendentes</p>
          <p className="text-sm font-semibold">{docsPendentes}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 space-y-1">
          <p className="text-[11px] text-muted-foreground font-medium">Plano de pagamento</p>
          <p className="text-sm font-semibold">{plano ? plano.status : 'Sem plano'}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 space-y-1">
          <p className="text-[11px] text-muted-foreground font-medium">Desde</p>
          <p className="text-sm font-semibold">{formatDate(caso?.created_at ?? null)}</p>
        </div>
      </div>
    </div>
  );
}

function ProcessosView({ processos }: { processos: Processo[] }) {
  if (!processos.length)
    return <p className="py-10 text-sm text-muted-foreground text-center">Nenhum processo vinculado</p>;
  return (
    <div className="space-y-2">
      {processos.map((p) => (
        <div key={p.id} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-muted/20 transition-colors">
          <Gavel className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{p.numero_cnj ?? '—'}</p>
            <p className="text-xs text-muted-foreground">{p.tribunal} · {p.classe}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-muted-foreground">{formatDate(p.data_ultima_movimentacao)}</p>
            <p className="text-xs font-medium">{p.status ?? '—'}</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        </div>
      ))}
    </div>
  );
}

function PlanoView({ plano }: { plano: Plano | null }) {
  if (!plano)
    return <p className="py-10 text-sm text-muted-foreground text-center">Nenhum plano de pagamento ativo</p>;

  const pct = plano.total_parcelas
    ? Math.round(((plano.parcelas_pagas ?? 0) / plano.total_parcelas) * 100)
    : 0;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-[11px] text-muted-foreground">Status</p>
            <p className="text-sm font-semibold capitalize">{plano.status}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Valor total</p>
            <p className="text-sm font-semibold">{fmt(plano.valor_total)}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Parcelas</p>
            <p className="text-sm font-semibold">{plano.parcelas_pagas ?? 0}/{plano.total_parcelas ?? 0}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Início</p>
            <p className="text-sm font-semibold">{formatDate(plano.data_inicio)}</p>
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-muted-foreground">Progresso de pagamento</span>
            <span className="text-xs font-medium">{pct}%</span>
          </div>
          <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function DocumentosView({ documentos }: { documentos: Documento[] }) {
  const STATUS_STYLE: Record<string, string> = {
    pendente_envio: 'bg-gray-100 text-gray-600',
    enviado: 'bg-blue-50 text-blue-700',
    em_analise: 'bg-amber-50 text-amber-700',
    pendente_correcao: 'bg-orange-50 text-orange-700',
    aprovado: 'bg-green-50 text-green-700',
    rejeitado: 'bg-red-50 text-red-700',
  };
  if (!documentos.length)
    return <p className="py-10 text-sm text-muted-foreground text-center">Nenhum documento enviado</p>;
  return (
    <div className="space-y-1.5">
      {documentos.map((d) => (
        <div key={d.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-muted/20 transition-colors">
          <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <p className="text-sm flex-1 truncate">{d.nome}</p>
          <span className={cn(
            'text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0',
            STATUS_STYLE[d.workflow_status] ?? 'bg-gray-100 text-gray-600',
          )}>
            {d.workflow_status.replace(/_/g, ' ')}
          </span>
        </div>
      ))}
    </div>
  );
}

function PrazosView({ prazos }: { prazos: Prazo[] }) {
  if (!prazos.length)
    return <p className="py-10 text-sm text-muted-foreground text-center">Nenhum prazo próximo</p>;
  return (
    <div className="space-y-2">
      {prazos.map((p) => {
        const dias = Math.ceil(
          (new Date(p.data_prazo).getTime() - Date.now()) / 86400000,
        );
        return (
          <div key={p.id} className={cn(
            'flex items-center gap-4 p-4 rounded-xl border bg-card',
            p.urgente ? 'border-red-300 bg-red-50/30' : 'border-border',
          )}>
            <Clock className={cn('h-5 w-5 flex-shrink-0', p.urgente ? 'text-red-500' : 'text-muted-foreground')} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{p.descricao}</p>
              <p className="text-xs text-muted-foreground">{p.tipo ?? 'Prazo'}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-semibold">{formatDate(p.data_prazo)}</p>
              <p className={cn('text-xs', dias <= 3 ? 'text-red-600 font-medium' : 'text-muted-foreground')}>
                {dias === 0 ? 'Hoje' : dias === 1 ? 'Amanhã' : `${dias} dias`}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Hub ───────────────────────────────────────────────────────────────────────

export default function MeuCasoHub({ caso, documentos, plano, processos, prazos }: Props) {
  const [tab, setTab] = useState<Tab>('visao_geral');

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold">Meu Caso</h2>
        <p className="text-sm text-muted-foreground">
          {caso?.nome_cliente ?? 'Seu processo jurídico'}
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-0.5 border-b border-border overflow-x-auto no-scrollbar">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px flex-shrink-0',
              tab === id
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {tab === 'visao_geral' && <VisaoGeral caso={caso} documentos={documentos} plano={plano} />}
        {tab === 'processos'   && <ProcessosView processos={processos} />}
        {tab === 'plano'       && <PlanoView plano={plano} />}
        {tab === 'documentos'  && <DocumentosView documentos={documentos} />}
        {tab === 'prazos'      && <PrazosView prazos={prazos} />}
      </div>
    </div>
  );
}
