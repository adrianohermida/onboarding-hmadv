'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { CreditCard, CheckCircle2, Clock, AlertCircle, X, Plus, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PlanoPagamento } from '@/app/(workspace)/planos/page';

interface Parcela {
  numero: number;
  valor: number;
  data_vencimento: string;
  pago?: boolean;
}

interface Props {
  initial: PlanoPagamento[];
  isAdmin: boolean;
  userId: string;
}

const STATUS_CONFIG: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  em_analise:  { label: 'Em análise',  cls: 'bg-amber-500/10 text-amber-500',  icon: Clock },
  aprovado:    { label: 'Aprovado',    cls: 'bg-green-500/10 text-green-500',  icon: CheckCircle2 },
  ativo:       { label: 'Ativo',       cls: 'bg-blue-500/10 text-blue-500',    icon: CreditCard },
  quitado:     { label: 'Quitado',     cls: 'bg-green-500/10 text-green-500',  icon: CheckCircle2 },
  cancelado:   { label: 'Cancelado',   cls: 'bg-rose-500/10 text-rose-500',    icon: AlertCircle },
  inadimplente:{ label: 'Inadimplente',cls: 'bg-rose-500/10 text-rose-500',    icon: AlertCircle },
};

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function parseCronograma(raw: unknown): Parcela[] {
  if (!Array.isArray(raw)) return [];
  return raw as Parcela[];
}

function usePlanos(initial: PlanoPagamento[]) {
  const supabase = createClient();
  return useQuery<PlanoPagamento[]>({
    queryKey: ['portal-planos-pagamento'],
    queryFn: async () => {
      const { data } = await supabase
        .from('portal_planos_pagamento')
        .select('id, user_id, caso_id, titulo, status, valor_total, parcela_sugerida, prazo_meses, cronograma, observacao, created_at, updated_at')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(100);
      return data ?? [];
    },
    initialData: initial,
    staleTime: 60_000,
  });
}

function useCriarPlano() {
  const qc = useQueryClient();
  const supabase = createClient();
  return useMutation({
    mutationFn: async (novo: { titulo: string; valor_total: number; parcela_sugerida: number; prazo_meses: number; observacao?: string; user_id_alvo: string }) => {
      const { error } = await supabase.from('portal_planos_pagamento').insert({
        user_id: novo.user_id_alvo,
        titulo: novo.titulo,
        valor_total: novo.valor_total,
        parcela_sugerida: novo.parcela_sugerida,
        prazo_meses: novo.prazo_meses,
        observacao: novo.observacao || null,
        status: 'em_analise',
        source: 'admin',
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['portal-planos-pagamento'] }),
  });
}

function useAtualizarStatus() {
  const qc = useQueryClient();
  const supabase = createClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('portal_planos_pagamento')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['portal-planos-pagamento'] }),
  });
}

function NovoPlaноForm({ userId, onClose }: { userId: string; onClose: () => void }) {
  const [titulo, setTitulo] = useState('Plano sugerido');
  const [valorTotal, setValorTotal] = useState('');
  const [parcelaSugerida, setParcelaSugerida] = useState('');
  const [prazoMeses, setPrazoMeses] = useState('');
  const [observacao, setObservacao] = useState('');
  const criar = useCriarPlano();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valorTotal || !parcelaSugerida || !prazoMeses) return;
    await criar.mutateAsync({
      titulo: titulo.trim() || 'Plano sugerido',
      valor_total: parseFloat(valorTotal),
      parcela_sugerida: parseFloat(parcelaSugerida),
      prazo_meses: parseInt(prazoMeses),
      observacao,
      user_id_alvo: userId,
    });
    onClose();
  }

  return (
    <form onSubmit={submit} className="bg-card border border-border rounded-xl p-4 space-y-3 mb-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Novo plano de pagamento</p>
        <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      <input
        placeholder="Título do plano"
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
      />

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-[11px] text-muted-foreground mb-1">Valor total (R$)*</label>
          <input type="number" min="0" step="0.01" value={valorTotal} onChange={(e) => setValorTotal(e.target.value)} required
            className="w-full px-2 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div>
          <label className="block text-[11px] text-muted-foreground mb-1">Parcela (R$)*</label>
          <input type="number" min="0" step="0.01" value={parcelaSugerida} onChange={(e) => setParcelaSugerida(e.target.value)} required
            className="w-full px-2 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div>
          <label className="block text-[11px] text-muted-foreground mb-1">Prazo (meses)*</label>
          <input type="number" min="1" value={prazoMeses} onChange={(e) => setPrazoMeses(e.target.value)} required
            className="w-full px-2 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
      </div>

      <textarea
        placeholder="Observações (opcional)"
        value={observacao}
        onChange={(e) => setObservacao(e.target.value)}
        rows={2}
        className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring resize-none"
      />

      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onClose}
          className="flex-1 px-3 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors">Cancelar</button>
        <button type="submit" disabled={!valorTotal || !parcelaSugerida || !prazoMeses || criar.isPending}
          className="flex-1 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors">
          {criar.isPending ? 'Criando…' : 'Criar plano'}
        </button>
      </div>
    </form>
  );
}

function PlanoCard({ plano, isAdmin }: { plano: PlanoPagamento; isAdmin: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const atualizar = useAtualizarStatus();
  const sCfg = STATUS_CONFIG[plano.status] ?? STATUS_CONFIG.em_analise;
  const StatusIcon = sCfg.icon;
  const cronograma = parseCronograma(plano.cronograma);
  const pagas = cronograma.filter((p) => p.pago).length;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn('flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center', sCfg.cls)}>
            <StatusIcon className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-foreground">{plano.titulo}</p>
              <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded', sCfg.cls)}>
                {sCfg.label}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-3">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total</p>
                <p className="text-sm font-bold text-foreground">{fmt(plano.valor_total)}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Parcela</p>
                <p className="text-sm font-bold text-foreground">{fmt(plano.parcela_sugerida)}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Prazo</p>
                <p className="text-sm font-bold text-foreground">{plano.prazo_meses} meses</p>
              </div>
            </div>
            {cronograma.length > 0 && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-muted-foreground">{pagas}/{cronograma.length} parcelas pagas</span>
                  <span className="text-[10px] text-muted-foreground">{Math.round((pagas / cronograma.length) * 100)}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: `${(pagas / cronograma.length) * 100}%` }}
                  />
                </div>
              </div>
            )}
            {plano.observacao && (
              <p className="text-xs text-muted-foreground mt-2">{plano.observacao}</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-2">
            {isAdmin && (
              <select
                value={plano.status}
                onChange={(e) => atualizar.mutate({ id: plano.id, status: e.target.value })}
                className="px-2 py-1 text-xs bg-muted border border-border rounded-lg focus:outline-none"
              >
                {Object.entries(STATUS_CONFIG).map(([v, c]) => (
                  <option key={v} value={v}>{c.label}</option>
                ))}
              </select>
            )}
          </div>
          {cronograma.length > 0 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Calendar className="h-3 w-3" />
              Cronograma
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          )}
        </div>
      </div>

      {expanded && cronograma.length > 0 && (
        <div className="border-t border-border bg-muted/20 divide-y divide-border">
          {cronograma.map((parcela) => (
            <div key={parcela.numero} className="flex items-center gap-3 px-4 py-2.5">
              <span className={cn(
                'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0',
                parcela.pago ? 'bg-green-500/20 text-green-500' : 'bg-muted text-muted-foreground',
              )}>
                {parcela.pago
                  ? <CheckCircle2 className="h-3.5 w-3.5" />
                  : <span className="text-[9px] font-bold">{parcela.numero}</span>}
              </span>
              <div className="flex-1 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Parcela {parcela.numero} — {formatDate(parcela.data_vencimento)}
                </span>
                <span className={cn('text-xs font-semibold', parcela.pago ? 'text-green-500' : 'text-foreground')}>
                  {fmt(parcela.valor)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PlanosClient({ initial, isAdmin, userId }: Props) {
  const { data: planos = initial } = usePlanos(initial);
  const [showForm, setShowForm] = useState(false);

  const totalValor = planos.reduce((s, p) => s + p.valor_total, 0);
  const ativos = planos.filter((p) => p.status === 'ativo' || p.status === 'aprovado').length;

  return (
    <div className="space-y-5 max-w-2xl">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center mb-2">
            <CreditCard className="h-3.5 w-3.5 text-blue-500" />
          </div>
          <p className="text-xl font-bold tabular-nums">{fmt(totalValor)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Total em honorários</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="w-7 h-7 rounded-lg bg-green-500/10 flex items-center justify-center mb-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
          </div>
          <p className="text-2xl font-bold tabular-nums">{ativos}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Planos ativos</p>
        </div>
      </div>

      {/* Toolbar */}
      {isAdmin && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Novo plano
          </button>
        </div>
      )}

      {showForm && <NovoPlaноForm userId={userId} onClose={() => setShowForm(false)} />}

      {/* Lista */}
      {planos.length === 0 ? (
        <div className="bg-card border border-border rounded-xl py-10 text-center">
          <CreditCard className="h-6 w-6 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Nenhum plano de pagamento cadastrado.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {planos.map((p) => <PlanoCard key={p.id} plano={p} isAdmin={isAdmin} />)}
        </div>
      )}
    </div>
  );
}
