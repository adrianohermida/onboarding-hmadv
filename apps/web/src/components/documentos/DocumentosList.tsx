'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { FileText, Upload, Filter } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { WORKFLOW_STATUS_LABELS } from '@/types';
import type { WorkflowStatus } from '@/types/database';
import StatusBadge from '../ui/StatusBadge';

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Todos os status' },
  { value: 'pendente_envio', label: 'Pendente envio' },
  { value: 'em_analise', label: 'Em análise' },
  { value: 'pendente_correcao', label: 'Correção pendente' },
  { value: 'aprovado', label: 'Aprovado' },
  { value: 'rejeitado', label: 'Rejeitado' },
  { value: 'assinado', label: 'Assinado' },
];

interface Doc {
  id: string;
  tipo: string;
  nome: string | null;
  workflow_status: WorkflowStatus;
  direction: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface Props {
  docs: Doc[];
  isAdmin: boolean;
  status?: string;
  page: number;
}

export default function DocumentosList({ docs, isAdmin, status = '', page }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function buildUrl(params: Record<string, string | undefined>) {
    const sp = new URLSearchParams();
    if (params.status) sp.set('status', params.status);
    if (params.page && params.page !== '1') sp.set('page', params.page);
    const q = sp.toString();
    return q ? `${pathname}?${q}` : pathname;
  }

  function handleStatus(value: string) {
    startTransition(() => {
      router.push(buildUrl({ status: value || undefined }));
    });
  }

  return (
    <div className={`space-y-3 transition-opacity ${isPending ? 'opacity-50' : ''}`}>
      {/* Filters */}
      <div className="flex gap-2">
        <select
          value={status}
          onChange={(e) => handleStatus(e.target.value)}
          className="px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground">
              <th className="text-left px-4 py-3 font-medium">Documento</th>
              {isAdmin && <th className="text-left px-4 py-3 font-medium">Cliente</th>}
              <th className="text-left px-4 py-3 font-medium">Direção</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Atualizado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {docs.map((doc) => (
              <tr
                key={doc.id}
                className="hover:bg-muted/40 transition-colors cursor-pointer"
                onClick={() => router.push(`/documentos/${doc.id}`)}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="font-medium capitalize">{doc.nome || doc.tipo.replace(/_/g, ' ')}</span>
                  </div>
                </td>
                {isAdmin && (
                  <td className="px-4 py-3 text-muted-foreground text-xs font-mono">{doc.user_id.slice(0, 8)}…</td>
                )}
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${doc.direction === 'entrada' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                    {doc.direction === 'entrada' ? 'Entrada' : 'Saída'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={doc.workflow_status} labels={WORKFLOW_STATUS_LABELS} />
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(doc.updated_at)}</td>
              </tr>
            ))}
            {docs.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 5 : 4} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  Nenhum documento encontrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {docs.map((doc) => (
          <Link
            key={doc.id}
            href={`/documentos/${doc.id}`}
            className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3 hover:bg-muted/40 transition-colors"
          >
            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate capitalize">{doc.nome || doc.tipo.replace(/_/g, ' ')}</p>
              <p className="text-xs text-muted-foreground">{formatDate(doc.updated_at)}</p>
            </div>
            <StatusBadge status={doc.workflow_status} labels={WORKFLOW_STATUS_LABELS} />
          </Link>
        ))}
        {docs.length === 0 && (
          <div className="py-12 flex flex-col items-center gap-2 text-muted-foreground">
            <FileText className="h-8 w-8" />
            <p className="text-sm">Nenhum documento</p>
          </div>
        )}
      </div>
    </div>
  );
}
