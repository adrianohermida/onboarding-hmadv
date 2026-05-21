'use client';

import { CreditCard, Calendar, DollarSign, CheckCircle2 } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { FASE_LABELS } from '@/types';
import StatusBadge from '../ui/StatusBadge';

interface Parcela {
  numero: number;
  valor: number;
  data_vencimento: string;
  pago?: boolean;
  data_pagamento?: string;
}

interface PlanoPagamento {
  total_divida?: number;
  desconto?: number;
  valor_acordo?: number;
  numero_parcelas?: number;
  valor_parcela?: number;
  data_inicio?: string;
  credor?: string;
  parcelas?: Parcela[];
  observacoes?: string;
}

interface CasoComPlano {
  id: string;
  user_id: string;
  nome: string | null;
  plano_pagamento: unknown;
  fase: string;
  created_at: string;
}

interface Props {
  casos: CasoComPlano[];
  isAdmin: boolean;
}

function parsePlano(raw: unknown): PlanoPagamento | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  return raw as PlanoPagamento;
}

function PlanoCard({ caso, isAdmin }: { caso: CasoComPlano; isAdmin: boolean }) {
  const plano = parsePlano(caso.plano_pagamento);

  if (!plano) {
    return (
      <div className="bg-card border border-border rounded-xl p-5">
        {isAdmin && <p className="text-sm font-medium mb-1">{caso.nome || '—'}</p>}
        <p className="text-sm text-muted-foreground">Plano não definido ainda</p>
      </div>
    );
  }

  const parcelas = plano.parcelas ?? [];
  const pagas = parcelas.filter((p) => p.pago).length;
  const totalParcelas = plano.numero_parcelas ?? parcelas.length;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div>
          {isAdmin && <p className="text-xs text-muted-foreground mb-0.5">{caso.nome || '—'}</p>}
          <h3 className="font-semibold">{plano.credor ? `Acordo com ${plano.credor}` : 'Plano de pagamento'}</h3>
          {plano.data_inicio && (
            <p className="text-xs text-muted-foreground">Início: {formatDate(plano.data_inicio)}</p>
          )}
        </div>
        <StatusBadge status={caso.fase ?? 'cadastro'} labels={FASE_LABELS} />
      </div>

      {/* Summary grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border">
        {[
          { icon: DollarSign, label: 'Dívida original', value: formatCurrency(plano.total_divida) },
          { icon: DollarSign, label: 'Valor do acordo', value: formatCurrency(plano.valor_acordo) },
          { icon: CreditCard, label: 'Parcelas', value: totalParcelas ? `${totalParcelas}x de ${formatCurrency(plano.valor_parcela)}` : '—' },
          { icon: CheckCircle2, label: 'Pagas', value: totalParcelas ? `${pagas} / ${totalParcelas}` : '—' },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-card px-4 py-3">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <Icon className="h-3.5 w-3.5" />
              <span className="text-xs">{label}</span>
            </div>
            <p className="text-sm font-semibold">{value}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      {totalParcelas > 0 && (
        <div className="px-5 py-3 border-t border-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span>Progresso</span>
            <span>{Math.round((pagas / totalParcelas) * 100)}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all"
              style={{ width: `${(pagas / totalParcelas) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Parcelas */}
      {parcelas.length > 0 && (
        <div className="border-t border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="text-left px-4 py-2 font-medium">#</th>
                <th className="text-left px-4 py-2 font-medium">Vencimento</th>
                <th className="text-right px-4 py-2 font-medium">Valor</th>
                <th className="text-left px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {parcelas.map((p) => (
                <tr key={p.numero} className={`transition-colors ${p.pago ? 'bg-green-50/30' : ''}`}>
                  <td className="px-4 py-2 text-muted-foreground">{p.numero}</td>
                  <td className="px-4 py-2">{formatDate(p.data_vencimento)}</td>
                  <td className="px-4 py-2 text-right font-medium">{formatCurrency(p.valor)}</td>
                  <td className="px-4 py-2">
                    {p.pago ? (
                      <span className="flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Pago{p.data_pagamento ? ` em ${formatDate(p.data_pagamento)}` : ''}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        Pendente
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {plano.observacoes && (
        <div className="px-5 py-3 border-t border-border">
          <p className="text-xs text-muted-foreground mb-1">Observações</p>
          <p className="text-sm">{plano.observacoes}</p>
        </div>
      )}
    </div>
  );
}

export default function PlanosList({ casos, isAdmin }: Props) {
  return (
    <div className="space-y-4">
      {casos.map((caso) => (
        <PlanoCard key={caso.id} caso={caso} isAdmin={isAdmin} />
      ))}
      {casos.length === 0 && (
        <div className="py-12 flex flex-col items-center gap-2 text-muted-foreground">
          <CreditCard className="h-8 w-8" />
          <p className="text-sm">Nenhum plano de pagamento</p>
        </div>
      )}
    </div>
  );
}
