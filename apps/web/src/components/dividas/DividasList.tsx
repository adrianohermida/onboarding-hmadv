'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, DollarSign, AlertTriangle } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { FASE_LABELS } from '@/types';
import StatusBadge from '../ui/StatusBadge';

interface Divida {
  credor: string;
  valor_original?: number;
  valor_atual?: number;
  tipo?: string;
  situacao?: string;
  data_vencimento?: string;
  inscricao_divida_ativa?: boolean;
  numero_contrato?: string;
}

interface CasoComDividas {
  id: string;
  user_id: string;
  nome: string | null;
  dividas: unknown;
  fase: string;
  created_at: string;
}

interface Props {
  casos: CasoComDividas[];
  isAdmin: boolean;
}

function parseDividas(raw: unknown): Divida[] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw as Divida[];
}

function CasoCard({ caso, isAdmin }: { caso: CasoComDividas; isAdmin: boolean }) {
  const [open, setOpen] = useState(!isAdmin);
  const dividas = parseDividas(caso.dividas);

  const totalOriginal = dividas.reduce((s, d) => s + (d.valor_original ?? 0), 0);
  const totalAtual = dividas.reduce((s, d) => s + (d.valor_atual ?? 0), 0);
  const hasAtiva = dividas.some((d) => d.inscricao_divida_ativa);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          {isAdmin && (
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
              {caso.nome?.split(' ').slice(0, 2).map((w) => w[0]).join('') || '?'}
            </div>
          )}
          <div className="text-left">
            {isAdmin && <p className="text-sm font-medium">{caso.nome || '—'}</p>}
            <p className="text-xs text-muted-foreground">
              {dividas.length} dívida{dividas.length !== 1 ? 's' : ''} · Total: {formatCurrency(totalAtual || totalOriginal)}
              {hasAtiva && <span className="ml-2 text-red-600">· Dívida ativa</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={caso.fase ?? 'cadastro'} labels={FASE_LABELS} />
          {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-border">
          {dividas.length === 0 ? (
            <p className="px-4 py-4 text-sm text-muted-foreground text-center">Nenhuma dívida registrada</p>
          ) : (
            <>
              {/* Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-border">
                {[
                  { label: 'Total original', value: formatCurrency(totalOriginal) },
                  { label: 'Total atual', value: formatCurrency(totalAtual) },
                  { label: 'Quantidade', value: String(dividas.length) },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-card px-4 py-3">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-sm font-semibold mt-0.5">{value}</p>
                  </div>
                ))}
              </div>

              {/* Debt table — desktop */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs text-muted-foreground">
                      <th className="text-left px-4 py-2.5 font-medium">Credor</th>
                      <th className="text-left px-4 py-2.5 font-medium">Tipo</th>
                      <th className="text-right px-4 py-2.5 font-medium">Valor original</th>
                      <th className="text-right px-4 py-2.5 font-medium">Valor atual</th>
                      <th className="text-left px-4 py-2.5 font-medium">Vencimento</th>
                      <th className="text-left px-4 py-2.5 font-medium">Situação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {dividas.map((d, i) => (
                      <tr key={i} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-2.5 font-medium">
                          <div className="flex items-center gap-1.5">
                            {d.inscricao_divida_ativa && <AlertTriangle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />}
                            {d.credor}
                          </div>
                          {d.numero_contrato && <p className="text-xs text-muted-foreground">Contrato: {d.numero_contrato}</p>}
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">{d.tipo || '—'}</td>
                        <td className="px-4 py-2.5 text-right">{formatCurrency(d.valor_original)}</td>
                        <td className="px-4 py-2.5 text-right font-medium">{formatCurrency(d.valor_atual)}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{d.data_vencimento ? formatDate(d.data_vencimento) : '—'}</td>
                        <td className="px-4 py-2.5">
                          {d.situacao && (
                            <span className="text-xs px-2 py-0.5 bg-muted rounded-full border border-border">{d.situacao}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Debt cards — mobile */}
              <div className="sm:hidden divide-y divide-border">
                {dividas.map((d, i) => (
                  <div key={i} className="px-4 py-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium flex items-center gap-1">
                        {d.inscricao_divida_ativa && <AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
                        {d.credor}
                      </p>
                      <p className="text-sm font-semibold">{formatCurrency(d.valor_atual || d.valor_original)}</p>
                    </div>
                    {d.tipo && <p className="text-xs text-muted-foreground">{d.tipo}</p>}
                    {d.situacao && <p className="text-xs text-muted-foreground">{d.situacao}</p>}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function DividasList({ casos, isAdmin }: Props) {
  return (
    <div className="space-y-3">
      {casos.map((caso) => (
        <CasoCard key={caso.id} caso={caso} isAdmin={isAdmin} />
      ))}
      {casos.length === 0 && (
        <div className="py-12 flex flex-col items-center gap-2 text-muted-foreground">
          <DollarSign className="h-8 w-8" />
          <p className="text-sm">Nenhuma dívida registrada</p>
        </div>
      )}
    </div>
  );
}
