'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, Clock, User, MapPin, Briefcase, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { formatDate, formatCurrency, getInitials } from '@/lib/utils';
import type { Tables } from '@/types/database';
import { WORKFLOW_STATUS_LABELS, FASE_LABELS } from '@/types';
import StatusBadge from '../ui/StatusBadge';
import FaseSelector from './FaseSelector';

type Caso = Tables<'portal_casos'>;
type Doc = Pick<Tables<'portal_documentos'>, 'id' | 'tipo' | 'nome' | 'workflow_status' | 'direction' | 'require_signature' | 'created_at' | 'updated_at'>;
type TimelineItem = Pick<Tables<'portal_timeline'>, 'id' | 'event_type' | 'title' | 'description' | 'created_at' | 'metadata'>;

interface Props {
  caso: Caso;
  docs: Doc[];
  timeline: TimelineItem[];
}

type Tab = 'visao_geral' | 'documentos' | 'timeline';

export default function ClienteDetail({ caso, docs, timeline }: Props) {
  const [tab, setTab] = useState<Tab>('visao_geral');
  const [showAll, setShowAll] = useState(false);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'visao_geral', label: 'Visão geral' },
    { id: 'documentos', label: `Documentos (${docs.length})` },
    { id: 'timeline', label: 'Timeline' },
  ];

  return (
    <div className="space-y-4 max-w-4xl">
      {/* Back + header */}
      <div className="flex items-start gap-3">
        <Link href="/clientes" className="mt-1 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0">
              {getInitials(caso.nome)}
            </div>
            <div>
              <h1 className="text-lg font-semibold">{caso.nome || '—'}</h1>
              <p className="text-xs text-muted-foreground">{caso.email || caso.cpf || 'Sem contato'}</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <FaseSelector casoId={caso.id} userId={caso.user_id} currentFase={caso.fase} />
            </div>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'visao_geral' && (
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Personal data */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
              <User className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Dados pessoais</h2>
            </div>
            <dl className="divide-y divide-border">
              {[
                { label: 'CPF', value: caso.cpf },
                { label: 'RG', value: caso.rg },
                { label: 'Telefone', value: caso.telefone },
                { label: 'Estado civil', value: caso.estado_civil },
                { label: 'Profissão', value: caso.profissao },
                { label: 'Situação profissional', value: caso.situacao_profissional },
              ].map(({ label, value }) => value ? (
                <div key={label} className="flex justify-between px-4 py-2.5 text-sm">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="font-medium text-right">{value}</dd>
                </div>
              ) : null)}
              {!caso.cpf && !caso.telefone && (
                <p className="px-4 py-4 text-sm text-muted-foreground text-center">Dados não preenchidos</p>
              )}
            </dl>
          </div>

          {/* Financial data */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Financeiro</h2>
            </div>
            <dl className="divide-y divide-border">
              {[
                { label: 'Renda mensal', value: caso.renda_mensal ? formatCurrency(caso.renda_mensal) : null },
                { label: 'Renda familiar', value: caso.renda_familiar ? formatCurrency(caso.renda_familiar) : null },
                { label: 'Comprometimento', value: caso.comprometimento_mensal ? formatCurrency(caso.comprometimento_mensal) : null },
                { label: 'Dependentes', value: caso.numero_dependentes != null ? String(caso.numero_dependentes) : null },
              ].map(({ label, value }) => value ? (
                <div key={label} className="flex justify-between px-4 py-2.5 text-sm">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="font-medium text-right">{value}</dd>
                </div>
              ) : null)}
              {!caso.renda_mensal && !caso.renda_familiar && (
                <p className="px-4 py-4 text-sm text-muted-foreground text-center">Dados não preenchidos</p>
              )}
            </dl>
          </div>

          {/* Case info */}
          <div className="bg-card border border-border rounded-xl overflow-hidden lg:col-span-2">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Processo</h2>
            </div>
            <dl className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
              <div className="divide-y divide-border">
                {[
                  { label: 'Fase', value: <StatusBadge status={caso.fase ?? 'cadastro'} labels={FASE_LABELS} /> },
                  { label: 'Onboarding', value: caso.onboarding_done ? 'Concluído' : `Etapa ${caso.cnj_step_atual}` },
                  { label: 'Responsável', value: caso.responsible_user_id ?? 'Não atribuído' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center px-4 py-2.5 text-sm">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="font-medium text-right">{value}</dd>
                  </div>
                ))}
              </div>
              <div className="divide-y divide-border">
                {[
                  { label: 'Cadastro', value: formatDate(caso.created_at) },
                  { label: 'Última atualização', value: formatDate(caso.updated_at) },
                  { label: 'Tags', value: caso.tags?.join(', ') || 'Nenhuma' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center px-4 py-2.5 text-sm">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="font-medium text-right">{value}</dd>
                  </div>
                ))}
              </div>
            </dl>
            {caso.notes && (
              <div className="px-4 py-3 border-t border-border">
                <p className="text-xs text-muted-foreground mb-1">Observações internas</p>
                <p className="text-sm">{caso.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'documentos' && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="divide-y divide-border">
            {docs.map((doc) => (
              <Link
                key={doc.id}
                href={`/documentos/${doc.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate capitalize">{doc.nome || doc.tipo.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(doc.updated_at)}</p>
                </div>
                <StatusBadge status={doc.workflow_status} labels={WORKFLOW_STATUS_LABELS} />
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
            {docs.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">Nenhum documento</p>
            )}
          </div>
        </div>
      )}

      {tab === 'timeline' && (
        <div className="space-y-1">
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
                  <p className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(item.created_at)}</p>
                </div>
                {item.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                )}
              </div>
            </div>
          ))}

          {timeline.length > 10 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="flex items-center gap-1 text-xs text-primary hover:underline ml-5"
            >
              {showAll ? <><ChevronUp className="h-3 w-3" /> Mostrar menos</> : <><ChevronDown className="h-3 w-3" /> Ver {timeline.length - 10} mais</>}
            </button>
          )}
          {timeline.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">Nenhum evento registrado</p>
          )}
        </div>
      )}
    </div>
  );
}
