'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, FileText, CheckCircle2, XCircle, RotateCcw, Eye } from 'lucide-react';
import { formatDate, formatBytes } from '@/lib/utils';
import type { Tables } from '@/types/database';
import { WORKFLOW_STATUS_LABELS } from '@/types';
import StatusBadge from '../ui/StatusBadge';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

type Doc = Tables<'portal_documentos'>;

interface Props {
  doc: Doc;
  isAdmin: boolean;
}

const ADMIN_TRANSITIONS: { status: string; label: string; icon: React.ElementType; style: string }[] = [
  { status: 'aprovado', label: 'Aprovar', icon: CheckCircle2, style: 'bg-green-600 hover:bg-green-700 text-white' },
  { status: 'pendente_correcao', label: 'Pedir correção', icon: RotateCcw, style: 'bg-orange-500 hover:bg-orange-600 text-white' },
  { status: 'rejeitado', label: 'Rejeitar', icon: XCircle, style: 'bg-red-600 hover:bg-red-700 text-white' },
];

export default function DocumentoDetail({ doc, isAdmin }: Props) {
  const router = useRouter();
  const [adminNotes, setAdminNotes] = useState(doc.admin_notes ?? '');
  const [isPending, startTransition] = useTransition();

  function updateStatus(newStatus: string) {
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase
        .from('portal_documentos')
        .update({ workflow_status: newStatus as any, admin_notes: adminNotes || null })
        .eq('id', doc.id);

      if (error) {
        toast.error('Erro ao atualizar status');
      } else {
        toast.success('Status atualizado');
        router.refresh();
      }
    });
  }

  const backHref = isAdmin ? `/clientes/${doc.user_id}` : '/documentos';

  return (
    <div className="space-y-4 max-w-2xl">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href={backHref} className="mt-1 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold capitalize">{doc.nome || doc.tipo.replace(/_/g, ' ')}</h1>
          <p className="text-xs text-muted-foreground">
            Enviado em {formatDate(doc.created_at)} · Atualizado em {formatDate(doc.updated_at)}
          </p>
        </div>
        <StatusBadge status={doc.workflow_status} labels={WORKFLOW_STATUS_LABELS} />
      </div>

      {/* File preview / download */}
      {doc.url && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{doc.nome || 'Arquivo'}</span>
              {doc.file_size && <span className="text-xs text-muted-foreground">({formatBytes(doc.file_size)})</span>}
            </div>
            <div className="flex gap-2">
              <a
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Eye className="h-4 w-4" />
              </a>
              <a
                href={doc.url}
                download
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Download className="h-4 w-4" />
              </a>
            </div>
          </div>
          {doc.mime_type?.startsWith('image/') && (
            <div className="p-4 flex items-center justify-center bg-muted/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={doc.url} alt={doc.nome ?? doc.tipo} className="max-h-80 rounded-lg object-contain" />
            </div>
          )}
        </div>
      )}

      {/* Metadata */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold">Detalhes</h2>
        </div>
        <dl className="divide-y divide-border">
          {[
            { label: 'Tipo', value: doc.tipo },
            { label: 'Direção', value: doc.direction === 'entrada' ? 'Entrada (cliente → escritório)' : 'Saída (escritório → cliente)' },
            { label: 'Versão', value: `v${doc.version}` },
            { label: 'Assinatura', value: doc.require_signature ? (doc.autentique_status ?? 'Pendente') : 'Não requerida' },
            doc.mime_type ? { label: 'Formato', value: doc.mime_type } : null,
          ].filter(Boolean).map(({ label, value }: any) => (
            <div key={label} className="flex justify-between px-4 py-2.5 text-sm">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="font-medium text-right">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Observação cliente */}
      {doc.observacao && (
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Observação do cliente</p>
          <p className="text-sm">{doc.observacao}</p>
        </div>
      )}

      {/* Admin actions */}
      {isAdmin && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <h2 className="text-sm font-semibold">Ações administrativas</h2>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Notas internas</label>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Adicionar nota sobre este documento..."
              rows={3}
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {ADMIN_TRANSITIONS.map((action) => (
              <button
                key={action.status}
                onClick={() => updateStatus(action.status)}
                disabled={isPending || doc.workflow_status === action.status}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors disabled:opacity-40 ${action.style}`}
              >
                <action.icon className="h-3.5 w-3.5" />
                {action.label}
              </button>
            ))}
          </div>

          {doc.admin_notes && (
            <p className="text-xs text-muted-foreground">Nota atual: {doc.admin_notes}</p>
          )}
        </div>
      )}
    </div>
  );
}
