'use client';

import { DollarSign, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';

interface Plano {
  id: string;
  caso_id: string;
  status: string;
  valor_total: number | null;
  total_parcelas: number | null;
  parcelas_pagas: number | null;
  data_inicio: string | null;
  observacoes: string | null;
  casos: { nome_cliente: string } | null;
}

interface DadoFinanceiro {
  id: string;
  caso_id: string;
  valor_divida_total: number | null;
  valor_honorarios: number | null;
  valor_custas: number | null;
  casos: { nome_cliente: string } | null;
}

interface Props {
  planos: Plano[];
  dividas: DadoFinanceiro[];
}

function fmt(v: number | null | undefined) {
  if (!v) return '—';
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function FinanceiroClient({ planos, dividas }: Props) {
  const totalHonorarios = dividas.reduce((s, d) => s + (d.valor_honorarios ?? 0), 0);
  const totalDividas = dividas.reduce((s, d) => s + (d.valor_divida_total ?? 0), 0);
  const planosAtivos = planos.filter((p) => p.status === 'ativo').length;
  const parcelasPagas = planos.reduce((s, p) => s + (p.parcelas_pagas ?? 0), 0);
  const totalParcelas = planos.reduce((s, p) => s + (p.total_parcelas ?? 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Financeiro</h2>
        <p className="text-sm text-muted-foreground">Visão consolidada de honorários, dívidas e planos de pagamento</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <DollarSign className="h-4 w-4" />
            <span className="text-xs font-medium">Honorários totais</span>
          </div>
          <p className="text-xl font-bold">{fmt(totalHonorarios)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span className="text-xs font-medium">Dívidas mapeadas</span>
          </div>
          <p className="text-xl font-bold">{fmt(totalDividas)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs font-medium">Planos ativos</span>
          </div>
          <p className="text-xl font-bold">{planosAtivos}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-xs font-medium">Parcelas pagas</span>
          </div>
          <p className="text-xl font-bold">
            {parcelasPagas}/{totalParcelas}
          </p>
        </div>
      </div>

      {/* Plans table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/30">
          <h3 className="text-sm font-semibold">Planos de Pagamento</h3>
        </div>
        {planos.length === 0 ? (
          <p className="px-4 py-8 text-sm text-muted-foreground text-center">Nenhum plano cadastrado</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Cliente</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground hidden sm:table-cell">Status</th>
                  <th className="text-right px-4 py-2 font-medium text-muted-foreground">Valor</th>
                  <th className="text-right px-4 py-2 font-medium text-muted-foreground hidden md:table-cell">Progresso</th>
                </tr>
              </thead>
              <tbody>
                {planos.map((p) => {
                  const pct = p.total_parcelas ? Math.round(((p.parcelas_pagas ?? 0) / p.total_parcelas) * 100) : 0;
                  return (
                    <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-medium">{p.casos?.nome_cliente ?? '—'}</td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                          p.status === 'ativo' ? 'bg-green-50 text-green-700 border-green-200' :
                          p.status === 'concluido' ? 'bg-teal-50 text-teal-700 border-teal-200' :
                          'bg-gray-100 text-gray-600 border-gray-200'
                        }`}>
                          {p.status ?? '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">{fmt(p.valor_total)}</td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="flex items-center gap-2 justify-end">
                          <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
