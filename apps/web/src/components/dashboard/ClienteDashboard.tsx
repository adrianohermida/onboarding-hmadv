'use client';

import Link from 'next/link';
import { FileText, CheckCircle2, Clock, AlertCircle, ChevronRight, Gavel } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { Tables } from '@/types/database';
import { WORKFLOW_STATUS_LABELS, FASE_LABELS } from '@/types';
import StatusBadge from '../ui/StatusBadge';

type Caso = Pick<Tables<'portal_casos'>, 'id' | 'nome' | 'fase' | 'onboarding_done' | 'cnj_step_atual' | 'created_at'> | null;
type Doc = Pick<Tables<'portal_documentos'>, 'id' | 'tipo' | 'workflow_status' | 'updated_at'>;

interface Props {
  caso: Caso;
  docs: Doc[];
}

const ONBOARDING_STEPS = [
  'Dados pessoais',
  'Endereço',
  'Dívidas',
  'Documentos',
  'Análise',
  'Proposta',
  'Assinatura',
];

export default function ClienteDashboard({ caso, docs }: Props) {
  if (!caso) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center px-4">
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
          <Gavel className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-base font-semibold">Caso em preparação</h2>
        <p className="text-sm text-muted-foreground max-w-sm">O escritório está configurando seu acesso.</p>
      </div>
    );
  }

  const stepAtual = caso.cnj_step_atual ?? 0;
  const progressPct = Math.min(100, Math.round((stepAtual / ONBOARDING_STEPS.length) * 100));

  const docsByStatus = {
    pendente: docs.filter((d) => d.workflow_status === 'pendente_envio' || d.workflow_status === 'enviado').length,
    em_analise: docs.filter((d) => d.workflow_status === 'em_analise' || d.workflow_status === 'recebido').length,
    aprovado: docs.filter((d) => d.workflow_status === 'aprovado' || d.workflow_status === 'assinado').length,
    pendente_correcao: docs.filter((d) => d.workflow_status === 'pendente_correcao').length,
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto p-3 sm:p-0">
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Seu processo</p>
            <h2 className="text-base font-semibold">{caso.nome || 'Processo'}</h2>
            <p className="text-xs text-muted-foreground mt-1">Desde {formatDate(caso.created_at)}</p>
          </div>
          <StatusBadge status={caso.fase ?? 'cadastro'} labels={FASE_LABELS} />
        </div>

        {!caso.onboarding_done && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-medium text-foreground">Jornada</p>
              <p className="text-xs text-muted-foreground">{stepAtual}/{ONBOARDING_STEPS.length} etapas</p>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {ONBOARDING_STEPS.map((step, i) => (
                <span
                  key={step}
                  className={`text-xs px-2 py-0.5 rounded-md border ${
                    i < stepAtual
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : i === stepAtual
                      ? 'bg-primary/10 text-primary border-primary/20 font-medium'
                      : 'bg-muted text-muted-foreground border-border'
                  }`}
                >
                  {step}
                </span>
              ))}
            </div>
            <Link
              href="/onboarding"
              className="mt-3 inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline"
            >
              Continuar <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        )}

        {caso.onboarding_done && (
          <div className="mt-3 flex items-center gap-2 text-xs text-green-700">
            <CheckCircle2 className="h-4 w-4" />
            Jornada concluída
          </div>
        )}
      </div>

      {/* Document summary */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold">Meus documentos</h2>
          <Link href="/documentos" className="text-xs text-primary hover:underline">Ver todos</Link>
        </div>

        <div className="grid grid-cols-2 divide-x divide-y divide-border">
          <div className="p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-amber-50 flex items-center justify-center">
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="text-xl font-bold">{docsByStatus.em_analise}</p>
              <p className="text-xs text-muted-foreground">Em análise</p>
            </div>
          </div>
          <div className="p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-green-50 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-xl font-bold">{docsByStatus.aprovado}</p>
              <p className="text-xs text-muted-foreground">Aprovados</p>
            </div>
          </div>
          <div className="p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-gray-50 flex items-center justify-center">
              <FileText className="h-4 w-4 text-gray-500" />
            </div>
            <div>
              <p className="text-xl font-bold">{docsByStatus.pendente}</p>
              <p className="text-xs text-muted-foreground">Pendentes</p>
            </div>
          </div>
          <div className="p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-orange-50 flex items-center justify-center">
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </div>
            <div>
              <p className="text-xl font-bold">{docsByStatus.pendente_correcao}</p>
              <p className="text-xs text-muted-foreground">Correção</p>
            </div>
          </div>
        </div>

        {docs.length > 0 && (
          <div className="divide-y divide-border border-t border-border">
            {docs.slice(0, 3).map((doc) => (
              <Link
                key={doc.id}
                href={`/documentos/${doc.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
              >
                <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate capitalize">{doc.tipo.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(doc.updated_at)}</p>
                </div>
                <StatusBadge status={doc.workflow_status} labels={WORKFLOW_STATUS_LABELS} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
