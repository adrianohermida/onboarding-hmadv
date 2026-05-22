'use client';

import { useState, useTransition, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { FileText, Upload, X, CloudUpload, ChevronRight, ChevronLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatDate } from '@/lib/utils';
import { WORKFLOW_STATUS_LABELS } from '@/types';
import type { WorkflowStatus } from '@/types/database';
import StatusBadge from '../ui/StatusBadge';
import { cn } from '@/lib/utils';

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Todos os status' },
  { value: 'pendente_envio', label: 'Pendente envio' },
  { value: 'em_analise', label: 'Em análise' },
  { value: 'pendente_correcao', label: 'Correção pendente' },
  { value: 'aprovado', label: 'Aprovado' },
  { value: 'rejeitado', label: 'Rejeitado' },
  { value: 'assinado', label: 'Assinado' },
];

const TIPO_OPTIONS = [
  'rg', 'cpf', 'comprovante_residencia', 'comprovante_renda',
  'extrato_bancario', 'contrato', 'procuracao', 'outros',
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
  total: number;
  pageSize: number;
}

function UploadModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [tipo, setTipo] = useState('outros');
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  }, []);

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const ext = file.name.split('.').pop();
      const path = `${user.id}/${Date.now()}_${tipo}.${ext}`;
      const { error: storageErr } = await supabase.storage.from('documentos').upload(path, file);
      if (storageErr) throw storageErr;

      const { data: { publicUrl } } = supabase.storage.from('documentos').getPublicUrl(path);

      const { error: dbErr } = await supabase.from('portal_documentos').insert({
        user_id: user.id,
        tipo,
        nome: file.name,
        url: publicUrl,
        mime_type: file.type,
        file_size: file.size,
        direction: 'entrada',
        workflow_status: 'enviado',
      });
      if (dbErr) throw dbErr;

      onSuccess();
    } catch (err: any) {
      setError(err?.message ?? 'Erro ao enviar documento');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-background rounded-2xl border border-border shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <CloudUpload className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Enviar Documento</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Drop zone */}
          <div
            className={cn(
              'relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors',
              dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/30',
            )}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              className="sr-only"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
            />
            {file ? (
              <div className="flex items-center justify-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-foreground">{file.name}</span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className="p-0.5 rounded-full hover:bg-muted text-muted-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <>
                <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-foreground font-medium">Arraste ou clique para selecionar</p>
                <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG, DOC — até 10 MB</p>
              </>
            )}
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Tipo de documento</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:bg-background"
            >
              {TIPO_OPTIONS.map((t) => (
                <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm border border-border rounded-xl hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleUpload}
              disabled={!file || uploading}
              className="flex-1 px-4 py-2.5 text-sm bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {uploading ? (
                <><div className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" /> Enviando…</>
              ) : (
                <><Upload className="h-4 w-4" /> Enviar</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DocumentosList({ docs, isAdmin, status = '', page, total, pageSize }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [showUpload, setShowUpload] = useState(false);

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

  function handleUploadSuccess() {
    setShowUpload(false);
    router.refresh();
  }

  return (
    <>
      {showUpload && <UploadModal onClose={() => setShowUpload(false)} onSuccess={handleUploadSuccess} />}

      <div className={cn('space-y-3 transition-opacity', isPending && 'opacity-50')}>
        {/* Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={status}
            onChange={(e) => handleStatus(e.target.value)}
            className="px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <div className="flex-1" />

          {!isAdmin && (
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Upload className="h-3.5 w-3.5" />
              Enviar documento
            </button>
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-xs text-muted-foreground">
                <th className="text-left px-4 py-3 font-semibold uppercase tracking-wide">Documento</th>
                {isAdmin && <th className="text-left px-4 py-3 font-semibold uppercase tracking-wide">Usuário</th>}
                <th className="text-left px-4 py-3 font-semibold uppercase tracking-wide">Direção</th>
                <th className="text-left px-4 py-3 font-semibold uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 font-semibold uppercase tracking-wide">Atualizado</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {docs.map((doc) => (
                <tr
                  key={doc.id}
                  className="hover:bg-muted/40 transition-colors cursor-pointer group"
                  onClick={() => router.push(`/documentos/${doc.id}`)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <span className="font-medium capitalize">{doc.nome || doc.tipo.replace(/_/g, ' ')}</span>
                    </div>
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-muted-foreground text-xs font-mono">{doc.user_id.slice(0, 8)}…</td>
                  )}
                  <td className="px-4 py-3">
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full ring-1',
                      doc.direction === 'entrada'
                        ? 'bg-blue-500/10 text-blue-400 ring-blue-500/20'
                        : 'bg-muted text-muted-foreground ring-border',
                    )}>
                      {doc.direction === 'entrada' ? 'Entrada' : 'Saída'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={doc.workflow_status} labels={WORKFLOW_STATUS_LABELS} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(doc.updated_at)}</td>
                  <td className="pr-3">
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                  </td>
                </tr>
              ))}
              {docs.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="px-4 py-12 text-center">
                    <FileText className="h-6 w-6 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Nenhum documento encontrado</p>
                    {!isAdmin && (
                      <button
                        onClick={() => setShowUpload(true)}
                        className="mt-3 text-xs text-primary hover:underline"
                      >
                        Enviar o primeiro documento
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-2">
          {/* Mobile upload button */}
          {!isAdmin && (
            <button
              onClick={() => setShowUpload(true)}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 border-2 border-dashed border-border rounded-xl text-sm text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
            >
              <Upload className="h-4 w-4" />
              Enviar documento
            </button>
          )}

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
          {docs.length === 0 && !isAdmin && (
            <div className="py-8 flex flex-col items-center gap-2 text-muted-foreground">
              <FileText className="h-8 w-8" />
              <p className="text-sm">Nenhum documento enviado</p>
            </div>
          )}
          {docs.length === 0 && isAdmin && (
            <div className="py-8 flex flex-col items-center gap-2 text-muted-foreground">
              <FileText className="h-8 w-8" />
              <p className="text-sm">Nenhum documento encontrado</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {total > pageSize && (
          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-muted-foreground">
              {total} documentos — Página {page} de {Math.ceil(total / pageSize)}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => startTransition(() => router.push(buildUrl({ status: status || undefined, page: String(page - 1) })))}
                disabled={page <= 1 || isPending}
                className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => startTransition(() => router.push(buildUrl({ status: status || undefined, page: String(page + 1) })))}
                disabled={page >= Math.ceil(total / pageSize) || isPending}
                className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
