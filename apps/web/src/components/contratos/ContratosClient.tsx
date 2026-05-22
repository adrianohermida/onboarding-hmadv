'use client';

import { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import {
  FileCheck, Download, Eye, Clock, CheckCircle2, PenLine,
  CloudUpload, X, Plus, FileX, AlertCircle, Search, ChevronLeft, ChevronRight, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/lib/hooks/use-global-search';

interface Contrato {
  id: string;
  user_id: string;
  caso_id: string | null;
  titulo: string;
  tipo: string | null;
  status: string;
  assinatura_status: string | null;
  assinado_em: string | null;
  arquivo_url: string | null;
  created_at: string;
  updated_at: string;
}

interface ContratosPaginados {
  data: Contrato[];
  total: number;
  page: number;
}

interface Props {
  isAdmin: boolean;
  userId: string;
}

const PAGE_SIZE = 30;

const TIPO_LABELS: Record<string, string> = {
  honorarios:        'Contrato de Honorários',
  procuracao:        'Procuração',
  acordo:            'Acordo',
  termo_compromisso: 'Termo de Compromisso',
  distrato:          'Distrato',
  aditivo:           'Aditivo',
  outro:             'Outro',
};

const STATUS_CONFIG: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  rascunho:            { label: 'Rascunho',           cls: 'bg-muted text-muted-foreground',       icon: Clock },
  pendente_assinatura: { label: 'Aguard. assinatura', cls: 'bg-amber-500/10 text-amber-500',       icon: PenLine },
  assinado:            { label: 'Assinado',           cls: 'bg-green-500/10 text-green-500',       icon: CheckCircle2 },
  cancelado:           { label: 'Cancelado',          cls: 'bg-rose-500/10 text-rose-500',         icon: FileX },
  em_revisao:          { label: 'Em revisão',         cls: 'bg-blue-500/10 text-blue-500',         icon: AlertCircle },
};

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function useContratosPaginados(filtros: { search: string; status: string | null; tipo: string | null }, page: number) {
  const supabase = createClient();
  return useQuery<ContratosPaginados>({
    queryKey: ['portal-contratos-paginados', filtros, page],
    staleTime: 30_000,
    queryFn: async () => {
      const from = page * PAGE_SIZE;
      const to   = from + PAGE_SIZE - 1;
      let q = supabase
        .from('portal_contratos')
        .select('id, user_id, caso_id, titulo, tipo, status, assinatura_status, assinado_em, arquivo_url, created_at, updated_at', { count: 'exact' })
        .is('deleted_at', null)
        .order('updated_at', { ascending: false })
        .range(from, to);
      if (filtros.search.trim().length >= 2) q = q.ilike('titulo', `%${filtros.search}%`);
      if (filtros.status)                    q = q.eq('status', filtros.status);
      if (filtros.tipo)                      q = q.eq('tipo', filtros.tipo);
      const { data, error, count } = await q;
      if (error) throw error;
      return { data: data ?? [], total: count ?? 0, page };
    },
  });
}

function useContratosKpis() {
  const supabase = createClient();
  return useQuery<{ total: number; assinados: number; pendentes: number }>({
    queryKey: ['portal-contratos-kpis'],
    staleTime: 60_000,
    queryFn: async () => {
      const [tRes, aRes, pRes] = await Promise.all([
        supabase.from('portal_contratos').select('id', { count: 'exact', head: true }).is('deleted_at', null),
        supabase.from('portal_contratos').select('id', { count: 'exact', head: true }).is('deleted_at', null).eq('status', 'assinado'),
        supabase.from('portal_contratos').select('id', { count: 'exact', head: true }).is('deleted_at', null).eq('status', 'pendente_assinatura'),
      ]);
      return { total: tRes.count ?? 0, assinados: aRes.count ?? 0, pendentes: pRes.count ?? 0 };
    },
  });
}

function useUploadContrato() {
  const qc = useQueryClient();
  const supabase = createClient();
  return useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const ext = file.name.split('.').pop() ?? 'pdf';
      const path = `contratos/${id}_${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('documentos').upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from('documentos').getPublicUrl(path);
      const { error } = await supabase
        .from('portal_contratos')
        .update({ arquivo_url: publicUrl, status: 'pendente_assinatura', updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['portal-contratos'] }); },
  });
}

function useCriarContrato() {
  const qc = useQueryClient();
  const supabase = createClient();
  return useMutation({
    mutationFn: async (novo: { titulo: string; tipo: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('portal_contratos').insert({
        user_id: user?.id,
        titulo: novo.titulo,
        tipo: novo.tipo,
        status: 'rascunho',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portal-contratos-paginados'] });
      qc.invalidateQueries({ queryKey: ['portal-contratos-kpis'] });
    },
  });
}

function UploadModal({ contrato, onClose }: { contrato: Contrato; onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadContrato();

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  }, []);

  async function submit() {
    if (!file) return;
    await upload.mutateAsync({ id: contrato.id, file });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Enviar arquivo</p>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground truncate">{contrato.titulo}</p>
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
          {file
            ? <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
            : <>
                <p className="text-sm text-muted-foreground">Arraste o arquivo aqui</p>
                <p className="text-xs text-muted-foreground/60 mt-1">PDF — até 10 MB</p>
              </>}
          <input ref={inputRef} type="file" accept=".pdf" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f); }} />
        </div>
        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 px-3 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors">Cancelar</button>
          <button onClick={submit} disabled={!file || upload.isPending}
            className="flex-1 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {upload.isPending ? 'Enviando…' : 'Enviar'}
          </button>
        </div>
      </div>
    </div>
  );
}

function NovoContratoForm({ onClose }: { onClose: () => void }) {
  const [titulo, setTitulo] = useState('');
  const [tipo, setTipo] = useState('honorarios');
  const criar = useCriarContrato();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim()) return;
    await criar.mutateAsync({ titulo: titulo.trim(), tipo });
    onClose();
  }

  return (
    <form onSubmit={submit} className="bg-card border border-border rounded-xl p-4 space-y-3 mb-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Novo contrato</p>
        <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>
      <input autoFocus placeholder="Título do contrato*" value={titulo} onChange={(e) => setTitulo(e.target.value)} required
        className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring" />
      <div>
        <label className="block text-[11px] text-muted-foreground mb-1">Tipo</label>
        <select value={tipo} onChange={(e) => setTipo(e.target.value)}
          className="w-full px-2 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring">
          {Object.entries(TIPO_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onClose}
          className="flex-1 px-3 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors">Cancelar</button>
        <button type="submit" disabled={!titulo.trim() || criar.isPending}
          className="flex-1 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors">
          {criar.isPending ? 'Criando…' : 'Criar'}
        </button>
      </div>
    </form>
  );
}

export default function ContratosClient({ isAdmin }: Props) {
  const [search, setSearch] = useState('');
  const [statusFiltro, setStatusFiltro] = useState<string | null>(null);
  const [tipoFiltro, setTipoFiltro] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [uploadFor, setUploadFor] = useState<Contrato | null>(null);
  const [showForm, setShowForm] = useState(false);

  const debouncedSearch = useDebounce(search, 350);
  const filtros = { search: debouncedSearch, status: statusFiltro, tipo: tipoFiltro };

  const { data: paginados, isFetching } = useContratosPaginados(filtros, page);
  const { data: kpis = { total: 0, assinados: 0, pendentes: 0 } } = useContratosKpis();

  const contratos = paginados?.data ?? [];
  const total     = paginados?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function handleFilterChange(fn: () => void) { fn(); setPage(0); }

  return (
    <div className="space-y-5 max-w-2xl">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center mb-2">
            <FileCheck className="h-3.5 w-3.5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold tabular-nums">{kpis.total}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Total de contratos</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="w-7 h-7 rounded-lg bg-green-500/10 flex items-center justify-center mb-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
          </div>
          <p className="text-2xl font-bold tabular-nums">{kpis.assinados}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Assinados</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center mb-2">
            <PenLine className="h-3.5 w-3.5 text-amber-500" />
          </div>
          <p className="text-2xl font-bold tabular-nums">{kpis.pendentes}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Aguard. assinatura</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-44">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input type="text" placeholder="Buscar contrato..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="w-full pl-9 pr-3 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:bg-background transition-colors" />
        </div>
        <select value={statusFiltro ?? ''} onChange={(e) => handleFilterChange(() => setStatusFiltro(e.target.value || null))}
          className="px-2.5 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="">Todo status</option>
          {Object.entries(STATUS_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
        </select>
        <select value={tipoFiltro ?? ''} onChange={(e) => handleFilterChange(() => setTipoFiltro(e.target.value || null))}
          className="px-2.5 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="">Todo tipo</option>
          {Object.entries(TIPO_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <div className="flex-1" />
        {isAdmin && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
            <Plus className="h-3.5 w-3.5" />
            Novo contrato
          </button>
        )}
      </div>

      {showForm && <NovoContratoForm onClose={() => setShowForm(false)} />}

      {/* Lista */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {isFetching && contratos.length === 0 ? (
          <div className="flex items-center justify-center py-10 gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Carregando contratos…</span>
          </div>
        ) : contratos.length === 0 ? (
          <div className="py-10 text-center">
            <FileCheck className="h-6 w-6 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Nenhum contrato encontrado.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {contratos.map((c) => {
              const sCfg = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.rascunho;
              const StatusIcon = sCfg.icon;
              const tipoLabel = c.tipo ? (TIPO_LABELS[c.tipo] ?? c.tipo) : 'Contrato';
              return (
                <div key={c.id} className="flex items-start gap-3 px-4 py-3.5 hover:bg-muted/30 transition-colors">
                  <div className={cn('flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5', sCfg.cls)}>
                    <StatusIcon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-foreground truncate">{c.titulo}</p>
                      <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded', sCfg.cls)}>
                        {sCfg.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
                      <span>{tipoLabel}</span>
                      {c.assinado_em && <span>Assinado em {formatDate(c.assinado_em)}</span>}
                      {!c.assinado_em && <span>Criado em {formatDate(c.created_at)}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {c.arquivo_url ? (
                      <>
                        <a href={c.arquivo_url} target="_blank" rel="noopener noreferrer"
                          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Visualizar">
                          <Eye className="h-3.5 w-3.5" />
                        </a>
                        <a href={c.arquivo_url} download
                          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Baixar">
                          <Download className="h-3.5 w-3.5" />
                        </a>
                      </>
                    ) : isAdmin ? (
                      <button onClick={() => setUploadFor(c)}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-muted hover:bg-muted/70 rounded-lg transition-colors">
                        <CloudUpload className="h-3 w-3" />
                        Arquivo
                      </button>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Aguardando</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{total.toLocaleString('pt-BR')} contrato{total !== 1 ? 's' : ''} — Página {page + 1} de {totalPages}</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
              className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-40 transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-40 transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {uploadFor && <UploadModal contrato={uploadFor} onClose={() => setUploadFor(null)} />}
    </div>
  );
}
