'use client';

import { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import {
  Receipt, Upload, Download, Eye, Clock, CheckCircle2,
  CloudUpload, X, FileText, Plus, AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Custa } from '@/app/(workspace)/custas/page';

interface Props {
  initial: Custa[];
  isAdmin: boolean;
  userId: string;
}

const CATEGORIA_LABELS: Record<string, string> = {
  guia:        'Guia judicial',
  taxa:        'Taxa',
  distribuicao:'Distribuição',
  citacao:     'Citação',
  pericia:     'Perícia',
  outro:       'Outro',
};

const STATUS_CONFIG: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  pendente:  { label: 'Pendente',   cls: 'bg-amber-500/10 text-amber-500',  icon: Clock },
  pago:      { label: 'Pago',       cls: 'bg-green-500/10 text-green-500',  icon: CheckCircle2 },
  vencido:   { label: 'Vencido',    cls: 'bg-rose-500/10 text-rose-500',    icon: AlertTriangle },
  cancelado: { label: 'Cancelado',  cls: 'bg-muted text-muted-foreground',  icon: X },
};

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function useCustas(initial: Custa[]) {
  const supabase = createClient();
  return useQuery<Custa[]>({
    queryKey: ['portal-custas'],
    queryFn: async () => {
      const { data } = await supabase
        .from('portal_custas')
        .select('id, user_id, caso_id, titulo, descricao, categoria, status, valor, data_lancamento, data_vencimento, comprovante_url, comprovante_nome, created_at')
        .is('deleted_at', null)
        .order('data_lancamento', { ascending: false })
        .limit(200);
      return data ?? [];
    },
    initialData: initial,
    staleTime: 30_000,
  });
}

function useEnviarComprovante() {
  const qc = useQueryClient();
  const supabase = createClient();
  return useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const ext = file.name.split('.').pop() ?? 'pdf';
      const path = `custas/${id}_${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('documentos').upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from('documentos').getPublicUrl(path);
      const { error } = await supabase
        .from('portal_custas')
        .update({ comprovante_url: publicUrl, comprovante_nome: file.name, status: 'pago', updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['portal-custas'] }),
  });
}

function useAtualizarStatus() {
  const qc = useQueryClient();
  const supabase = createClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('portal_custas')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['portal-custas'] }),
  });
}

function useCriarCusta() {
  const qc = useQueryClient();
  const supabase = createClient();
  return useMutation({
    mutationFn: async (nova: { titulo: string; categoria: string; valor: number; data_vencimento?: string; descricao?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('portal_custas').insert({
        user_id: user?.id,
        titulo: nova.titulo,
        categoria: nova.categoria,
        valor: nova.valor,
        data_vencimento: nova.data_vencimento || null,
        descricao: nova.descricao || null,
        status: 'pendente',
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['portal-custas'] }),
  });
}

function UploadModal({ custa, onClose }: { custa: Custa; onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const enviar = useEnviarComprovante();

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  }, []);

  async function submit() {
    if (!file) return;
    await enviar.mutateAsync({ id: custa.id, file });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Enviar comprovante</p>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground">{custa.titulo ?? 'Custa'} — {fmt(custa.valor)}</p>

        <div
          onDrop={onDrop}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors',
            drag ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/30',
          )}
        >
          <CloudUpload className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
          {file ? (
            <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">Arraste o comprovante aqui</p>
              <p className="text-xs text-muted-foreground/60 mt-1">PDF, JPG, PNG — até 10 MB</p>
            </>
          )}
          <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f); }} />
        </div>

        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 px-3 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors">
            Cancelar
          </button>
          <button onClick={submit} disabled={!file || enviar.isPending}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors">
            <Upload className="h-3.5 w-3.5" />
            {enviar.isPending ? 'Enviando…' : 'Enviar'}
          </button>
        </div>
      </div>
    </div>
  );
}

function NovaCustaForm({ onClose }: { onClose: () => void }) {
  const [titulo, setTitulo] = useState('');
  const [categoria, setCategoria] = useState('guia');
  const [valor, setValor] = useState('');
  const [vencimento, setVencimento] = useState('');
  const criar = useCriarCusta();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim() || !valor) return;
    await criar.mutateAsync({ titulo: titulo.trim(), categoria, valor: parseFloat(valor), data_vencimento: vencimento });
    onClose();
  }

  return (
    <form onSubmit={submit} className="bg-card border border-border rounded-xl p-4 space-y-3 mb-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Nova custa</p>
        <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      <input
        autoFocus
        placeholder="Título da custa*"
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        required
        className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
      />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] text-muted-foreground mb-1">Categoria</label>
          <select value={categoria} onChange={(e) => setCategoria(e.target.value)}
            className="w-full px-2 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring">
            {Object.entries(CATEGORIA_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[11px] text-muted-foreground mb-1">Valor (R$)*</label>
          <input type="number" min="0" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} required
            className="w-full px-2 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
      </div>

      <div>
        <label className="block text-[11px] text-muted-foreground mb-1">Vencimento</label>
        <input type="date" value={vencimento} onChange={(e) => setVencimento(e.target.value)}
          className="w-full px-2 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring" />
      </div>

      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onClose}
          className="flex-1 px-3 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors">Cancelar</button>
        <button type="submit" disabled={!titulo.trim() || !valor || criar.isPending}
          className="flex-1 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors">
          {criar.isPending ? 'Criando…' : 'Criar'}
        </button>
      </div>
    </form>
  );
}

export default function CustasClient({ initial, isAdmin, userId }: Props) {
  const { data: custas = initial } = useCustas(initial);
  const atualizarStatus = useAtualizarStatus();
  const [uploadFor, setUploadFor] = useState<Custa | null>(null);
  const [showForm, setShowForm] = useState(false);

  const totalValor = custas.reduce((s, c) => s + c.valor, 0);
  const totalPago = custas.filter((c) => c.status === 'pago').reduce((s, c) => s + c.valor, 0);
  const pendentes = custas.filter((c) => c.status === 'pendente' || c.status === 'vencido').length;

  return (
    <div className="space-y-5 max-w-2xl">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center mb-2">
            <Receipt className="h-3.5 w-3.5 text-blue-500" />
          </div>
          <p className="text-xl font-bold tabular-nums">{fmt(totalValor)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Total em custas</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="w-7 h-7 rounded-lg bg-green-500/10 flex items-center justify-center mb-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
          </div>
          <p className="text-xl font-bold tabular-nums">{fmt(totalPago)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Pago</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center mb-2">
            <Clock className="h-3.5 w-3.5 text-amber-500" />
          </div>
          <p className="text-2xl font-bold tabular-nums">{pendentes}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Pendentes</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{custas.length} registro{custas.length !== 1 ? 's' : ''}</p>
        {isAdmin && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
            <Plus className="h-3.5 w-3.5" />
            Nova custa
          </button>
        )}
      </div>

      {showForm && <NovaCustaForm onClose={() => setShowForm(false)} />}

      {/* Lista */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {custas.length === 0 ? (
          <div className="py-10 text-center">
            <Receipt className="h-6 w-6 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Nenhuma custa registrada.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {custas.map((c) => {
              const sCfg = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.pendente;
              const StatusIcon = sCfg.icon;
              const catLabel = CATEGORIA_LABELS[c.categoria] ?? c.categoria;
              return (
                <div key={c.id} className="flex items-start gap-3 px-4 py-3.5 hover:bg-muted/30 transition-colors">
                  <div className={cn('flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5', sCfg.cls)}>
                    <StatusIcon className="h-3.5 w-3.5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-foreground">{c.titulo ?? catLabel}</p>
                      <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded', sCfg.cls)}>
                        {sCfg.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
                      <span>{catLabel}</span>
                      {c.data_vencimento && <span>Vence {formatDate(c.data_vencimento)}</span>}
                      <span className="font-semibold text-foreground">{fmt(c.valor)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    {c.comprovante_url ? (
                      <a href={c.comprovante_url} target="_blank" rel="noopener noreferrer"
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="Ver comprovante">
                        <Eye className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <button
                        onClick={() => setUploadFor(c)}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-muted hover:bg-muted/70 rounded-lg transition-colors"
                        title="Enviar comprovante"
                      >
                        <Upload className="h-3 w-3" />
                        Comprovante
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {uploadFor && <UploadModal custa={uploadFor} onClose={() => setUploadFor(null)} />}
    </div>
  );
}
