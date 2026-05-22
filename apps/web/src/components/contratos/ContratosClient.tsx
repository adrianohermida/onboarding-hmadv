'use client';

import { useState } from 'react';
import { FileCheck, Download, Eye, Clock, CheckCircle2, XCircle, FileSignature, AlertCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { WorkflowStatus } from '@/types/database';
import { WORKFLOW_STATUS_LABELS } from '@/types';

interface Contrato {
  id: string;
  tipo: string;
  nome: string | null;
  url: string | null;
  workflow_status: WorkflowStatus;
  direction: string;
  mime_type: string | null;
  file_size: number | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  admin_notes: string | null;
}

interface Props {
  contratos: Contrato[];
  isAdmin: boolean;
}

const TIPO_LABELS: Record<string, string> = {
  contrato:             'Contrato',
  procuracao:           'Procuração',
  acordo:               'Acordo',
  termo_compromisso:    'Termo de Compromisso',
  contrato_honorarios:  'Contrato de Honorários',
};

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; cls: string }> = {
  pendente_envio:       { label: 'Aguardando',      icon: Clock,        cls: 'text-muted-foreground bg-muted/50' },
  enviado:              { label: 'Enviado',          icon: FileCheck,    cls: 'text-blue-500 bg-blue-500/10' },
  em_analise:           { label: 'Em análise',       icon: AlertCircle,  cls: 'text-amber-500 bg-amber-500/10' },
  aprovado:             { label: 'Aprovado',         icon: CheckCircle2, cls: 'text-green-500 bg-green-500/10' },
  aguardando_assinatura:{ label: 'Ag. assinatura',  icon: FileSignature, cls: 'text-violet-500 bg-violet-500/10' },
  assinado:             { label: 'Assinado',         icon: CheckCircle2, cls: 'text-teal-500 bg-teal-500/10' },
  rejeitado:            { label: 'Rejeitado',        icon: XCircle,      cls: 'text-rose-500 bg-rose-500/10' },
};

function StatusChip({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, icon: Clock, cls: 'text-muted-foreground bg-muted/50' };
  const Icon = cfg.icon;
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', cfg.cls)}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

function formatBytes(bytes: number | null) {
  if (!bytes) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ContratosClient({ contratos, isAdmin }: Props) {
  const [selected, setSelected] = useState<Contrato | null>(null);

  if (contratos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
        <FileCheck className="h-10 w-10 opacity-30" />
        <p className="text-sm font-medium">Nenhum contrato ainda</p>
        {!isAdmin && (
          <p className="text-xs text-center max-w-xs">
            Seus contratos e procurações aparecerão aqui assim que forem enviados pelo escritório.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Lista */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {contratos.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelected(c)}
            className={cn(
              'text-left bg-card border rounded-xl p-4 hover:border-primary/40 hover:bg-muted/20 transition-all group',
              selected?.id === c.id ? 'border-primary/50 bg-primary/5' : 'border-border',
            )}
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <FileCheck className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {c.nome || TIPO_LABELS[c.tipo] || c.tipo.replace(/_/g, ' ')}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {TIPO_LABELS[c.tipo] ?? c.tipo.replace(/_/g, ' ')}
                </p>
                <div className="mt-2">
                  <StatusChip status={c.workflow_status} />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
              <span className="text-[11px] text-muted-foreground">{formatDate(c.updated_at)}</span>
              {formatBytes(c.file_size) && (
                <span className="text-[11px] text-muted-foreground">{formatBytes(c.file_size)}</span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Detalhe */}
      {selected && (
        <div className="fixed inset-0 z-50 lg:static lg:z-auto flex items-end lg:items-start justify-center lg:justify-start">
          {/* Mobile overlay */}
          <div
            className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelected(null)}
          />

          <div className="relative z-10 w-full lg:w-auto bg-background lg:bg-card border-t lg:border border-border rounded-t-2xl lg:rounded-xl overflow-hidden lg:mt-0">
            {/* Cabeçalho */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <FileCheck className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">
                  {selected.nome || TIPO_LABELS[selected.tipo] || selected.tipo}
                </p>
                <p className="text-xs text-muted-foreground">{TIPO_LABELS[selected.tipo] ?? selected.tipo}</p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors text-xs"
              >
                Fechar
              </button>
            </div>

            {/* Corpo */}
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <StatusChip status={selected.workflow_status} />
                <span className="text-xs text-muted-foreground">
                  Atualizado em {formatDate(selected.updated_at)}
                </span>
              </div>

              {selected.admin_notes && (
                <div className="bg-amber-500/10 rounded-lg px-4 py-3 border border-amber-500/20">
                  <p className="text-xs font-medium text-amber-600 mb-1">Observação do escritório</p>
                  <p className="text-sm text-foreground">{selected.admin_notes}</p>
                </div>
              )}

              {/* Ações */}
              <div className="flex flex-col gap-2 pt-1">
                {selected.url && (
                  <>
                    <a
                      href={selected.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                      Visualizar documento
                    </a>
                    <a
                      href={selected.url}
                      download
                      className="flex items-center justify-center gap-2 px-4 py-2.5 border border-border rounded-lg text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      Baixar
                    </a>
                  </>
                )}
                {!selected.url && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/40 rounded-lg px-4 py-3">
                    <Clock className="h-4 w-4" />
                    Documento ainda não disponível
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
