'use client';

import { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import {
  Receipt, Upload, Download, Clock, CheckCircle2,
  CloudUpload, X, Plus, AlertTriangle, Search, ChevronLeft, ChevronRight, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/lib/hooks/use-global-search';

interface Custa {
  id: string;
  user_id: string;
  caso_id: string | null;
  titulo: string | null;
  categoria: string;
  status: string;
  valor: number;
  data_vencimento: string | null;
  created_at: string;
}

interface CustasPaginadas {
  data: Custa[];
  total: number;
  page: number;
}

interface Props {
  isAdmin: boolean;
  userId: string;
}

const PAGE_SIZE = 50;

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

function useCustasPaginadas(filtros: { search: string; status: string | null; categoria: string | null }, page: number) {
  const supabase = createClient();
  return useQuery<CustasPaginadas>({
    queryKey: ['portal-custas-paginadas', filtros, page],
    staleTime: 30_000,
    queryFn: async () => {
      const from = page * PAGE_SIZE;
      const to   = from + PAGE_SIZE - 1;
      let q = supabase
        .from('portal_custas')
        .select('id, user_id, caso_id, titulo, categoria, status, valor, data_vencimento, created_at', { count: 'exact' })
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .range(from, to);
      if (filtros.search.trim().length >= 2) q = q.ilike('titulo', `%${filtros.search}%`);
      if (filtros.status)    q = q.eq('status', filtros.status);
      if (filtros.categoria) q = q.eq('categoria', filtros.categoria);
      const { data, error, count } = await q;
      if (error) throw error;
      return { data: data ?? [], total: count ?? 0, page };
    },
  });
}

function useCustasKpis() {
  const supabase = createClient();
  return useQuery<{ totalValor: number; totalPago: number; pendentes: number }>({
    queryKey: ['portal-custas-kpis'],
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from('portal_custas')
        .select('valor, status')
        .is('deleted_at', null)
        .limit(10_000);
      const rows = data ?? [];
      const totalValor = rows.reduce((s, r) => s + (r.valor ?? 0), 0);
      const totalPago  = rows.filter((r) => r.status === 'pago').reduce((s, r) => s + (r.valor ?? 0), 0);
      const pendentes  = rows.filter((r) => r.status === 'pendente' || r.status === 'vencido').length;
      return { totalValor, totalPago, pendentes };
    },
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
      const { error } = await supabase
        .from('portal_custas')
        .update({ status: 'pago' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portal-custas-paginadas'] });
      qc.invalidateQueries({ queryKey: ['portal-custas-kpis'] });
    },
  });
}

function useCriarCusta() {
  const qc = useQueryClient();
  const supabase = createClient();
  return useMutation({
    mutationFn: async (nova: { titulo: string; categoria: string; valor: number; data_vencimento?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('portal_custas').insert({
        user_id: user?.id,
        titulo: nova.titulo,
        categoria: nova.categoria,
        valor: nova.valor,
        data_vencimento: nova.data_vencimento || null,
        status: 'pendente',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portal-custas-paginadas'] });
      qc.invalidateQueries({ queryKey: ['portal-custas-kpis'] });
    },
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
            className="flex-1 px-3 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors">Cancelar</button>
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
      <input autoFocus placeholder="Título da custa*" value={titulo} onChange={(e) => setTitulo(e.target.value)} required
        className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring" />
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

export default function CustasClient({ isAdmin }: Props) {
  const [search, setSearch] = useState('');
  const [statusFiltro, setStatusFiltro] = useState<string | null>(null);
  const [categoriaFiltro, setCategoriaFiltro] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [uploadFor, setUploadFor] = useState<Custa | null>(null);
  const [showForm, setShowForm] = useState(false);

  const debouncedSearch = useDebounce(search, 350);
  const filtros = { search: debouncedSearch, status: statusFiltro, categoria: categoriaFiltro };

  const { data: paginadas, isFetching } = useCustasPaginadas(filtros, page);
  const { data: kpis = { totalValor: 0, totalPago: 0, pendentes: 0 } } = useCustasKpis();

  const custas     = paginadas?.data ?? [];
  const total      = paginadas?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function handleFilterChange(fn: () => void) { fn(); setPage(0); }

  return (
    <div className="space-y-5 max-w-2xl">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center mb-2">
            <Receipt className="h-3.5 w-3.5 text-blue-500" />
          </div>
          <p className="text-xl font-bold tabular-nums">{fmt(kpis.totalValor)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Total em custas</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="w-7 h-7 rounded-lg bg-green-500/10 flex items-center justify-center mb-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
          </div>
          <p className="text-xl font-bold tabular-nums">{fmt(kpis.totalPago)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Pago</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center mb-2">
            <Clock className="h-3.5 w-3.5 text-amber-500" />
          </div>
          <p className="text-2xl font-bold tabular-nums">{kpis.pendentes}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Pendentes</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-44">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input type="text" placeholder="Buscar custa..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="w-full pl-9 pr-3 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:bg-background transition-colors" />
        </div>
        <select value={statusFiltro ?? ''} onChange={(e) => handleFilterChange(() => setStatusFiltro(e.target.value || null))}
          className="px-2.5 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="">Todo status</option>
          {Object.entries(STATUS_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
        </select>
        <select value={categoriaFiltro ?? ''} onChange={(e) => handleFilterChange(() => setCategoriaFiltro(e.target.value || null))}
          className="px-2.5 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="">Toda categoria</option>
          {Object.entries(CATEGORIA_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <div className="flex-1" />
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
        {isFetching && custas.length === 0 ? (
          <div className="flex items-center justify-center py-10 gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Carregando custas…</span>
          </div>
        ) : custas.length === 0 ? (
          <div className="py-10 text-center">
            <Receipt className="h-6 w-6 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Nenhuma custa encontrada.</p>
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
                    {c.status !== 'pago' && (
                      <button onClick={() => setUploadFor(c)}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-muted hover:bg-muted/70 rounded-lg transition-colors" title="Enviar comprovante">
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

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{total.toLocaleString('pt-BR')} registro{total !== 1 ? 's' : ''} — Página {page + 1} de {totalPages}</span>
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

      {uploadFor && <UploadModal custa={uploadFor} onClose={() => setUploadFor(null)} />}
    </div>
  );
}
