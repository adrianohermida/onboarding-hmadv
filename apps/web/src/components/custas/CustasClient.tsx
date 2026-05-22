'use client';

import { useState, useRef, useCallback } from 'react';
import { Receipt, Upload, Download, Eye, Clock, CheckCircle2, CloudUpload, X, FileText } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { WorkflowStatus } from '@/types/database';

interface Comprovante {
  id: string;
  tipo: string;
  nome: string | null;
  url: string | null;
  workflow_status: WorkflowStatus;
  mime_type: string | null;
  file_size: number | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  admin_notes: string | null;
}

interface DadoFinanceiro {
  id: string;
  caso_id: string;
  valor_custas: number | null;
  casos: { nome_cliente: string; user_id: string } | null;
}

interface Props {
  comprovantes: Comprovante[];
  dadosFinanceiros: DadoFinanceiro[];
  isAdmin: boolean;
  userId: string;
}

function fmt(v: number | null | undefined) {
  if (!v) return '—';
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatBytes(b: number | null) {
  if (!b) return null;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function UploadModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  }, []);

  async function upload() {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const ext = file.name.split('.').pop();
      const path = `${user.id}/custas/${Date.now()}.${ext}`;
      const { error: storageErr } = await supabase.storage.from('documentos').upload(path, file);
      if (storageErr) throw storageErr;

      const { data: { publicUrl } } = supabase.storage.from('documentos').getPublicUrl(path);

      const { error: dbErr } = await supabase.from('portal_documentos').insert({
        user_id: user.id,
        tipo: 'comprovante_custas',
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
      setError(err?.message ?? 'Erro ao enviar comprovante');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-background rounded-2xl border border-border shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <CloudUpload className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Enviar Comprovante</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div
            className={cn(
              'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors',
              dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/30',
            )}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
          >
            <input ref={inputRef} type="file" className="sr-only" accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])} />
            {file ? (
              <div className="flex items-center justify-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{file.name}</span>
                <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className="p-0.5 rounded-full hover:bg-muted text-muted-foreground">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <>
                <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-foreground font-medium">Arraste ou clique para selecionar</p>
                <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG</p>
              </>
            )}
          </div>
          {error && <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm border border-border rounded-xl hover:bg-muted transition-colors">
              Cancelar
            </button>
            <button onClick={upload} disabled={!file || uploading}
              className="flex-1 px-4 py-2.5 text-sm bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
              {uploading
                ? <><div className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" /> Enviando…</>
                : <><Upload className="h-4 w-4" /> Enviar</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CustasClient({ comprovantes, dadosFinanceiros, isAdmin, userId }: Props) {
  const [showUpload, setShowUpload] = useState(false);

  const totalCustas = dadosFinanceiros.reduce((s, d) => s + (d.valor_custas ?? 0), 0);

  return (
    <>
      {showUpload && (
        <UploadModal onClose={() => setShowUpload(false)} onSuccess={() => { setShowUpload(false); window.location.reload(); }} />
      )}

      <div className="space-y-6">
        {/* KPI */}
        {totalCustas > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Total de custas mapeadas</p>
              <p className="text-2xl font-bold text-foreground">{fmt(totalCustas)}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Comprovantes enviados</p>
              <p className="text-2xl font-bold text-foreground">{comprovantes.length}</p>
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {comprovantes.length} comprovante{comprovantes.length !== 1 ? 's' : ''}
          </p>
          {!isAdmin && (
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Upload className="h-3.5 w-3.5" />
              Enviar comprovante
            </button>
          )}
        </div>

        {/* Lista de comprovantes */}
        {comprovantes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground border border-dashed border-border rounded-xl">
            <Receipt className="h-8 w-8 opacity-40" />
            <p className="text-sm font-medium">Nenhum comprovante enviado</p>
            {!isAdmin && (
              <>
                <p className="text-xs text-center max-w-xs">
                  Envie comprovantes de pagamento de custas processuais, guias e taxas aqui.
                </p>
                <button
                  onClick={() => setShowUpload(true)}
                  className="mt-1 flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Upload className="h-3.5 w-3.5" />
                  Enviar o primeiro comprovante
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="divide-y divide-border">
              {comprovantes.map((doc) => (
                <div key={doc.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <Receipt className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {doc.nome || doc.tipo.replace(/_/g, ' ')}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{formatDate(doc.created_at)}</span>
                      {formatBytes(doc.file_size) && (
                        <span className="text-xs text-muted-foreground/60">{formatBytes(doc.file_size)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {doc.workflow_status === 'aprovado' ? (
                      <span className="flex items-center gap-1 text-xs text-green-500">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Aprovado
                      </span>
                    ) : doc.workflow_status === 'em_analise' ? (
                      <span className="flex items-center gap-1 text-xs text-amber-500">
                        <Clock className="h-3.5 w-3.5" /> Em análise
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" /> {doc.workflow_status.replace(/_/g, ' ')}
                      </span>
                    )}
                    {doc.url && (
                      <a href={doc.url} target="_blank" rel="noopener noreferrer"
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="Visualizar">
                        <Eye className="h-3.5 w-3.5" />
                      </a>
                    )}
                    {doc.url && (
                      <a href={doc.url} download
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="Baixar">
                        <Download className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
