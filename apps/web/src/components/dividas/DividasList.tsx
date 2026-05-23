'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, DollarSign, AlertTriangle } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { FASE_LABELS } from '@/types';
import StatusBadge from '../ui/StatusBadge';

interface Divida {
  id: string;
  user_id: string;
  credor: string;
  tipo: string | null;
  valor: number | null;
  situacao: string | null;
  negativado: boolean | null;
  numero_contrato: string | null;
  data_vencimento: string | null;
}

interface ClienteInfo {
  nome: string;
  fase: string;
}

interface Props {
  dividas: Divida[];
  clienteMap: Record<string, ClienteInfo>;
  isAdmin: boolean;
}

function DebtTable({ dividas }: { dividas: Divida[] }) {
  const total = dividas.reduce((s, d) => s + (d.valor ?? 0), 0);
  const hasNeg = dividas.some((d) => d.negativado);

  return (
    <div className="border-t border-border">
      <div className="grid grid-cols-3 gap-px bg-border">
        {[
          { label: 'Total', value: formatCurrency(total) },
          { label: 'Dívidas', value: String(dividas.length) },
          { label: 'Negativado', value: hasNeg ? 'Sim' : 'Não' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-card px-4 py-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-sm font-semibold mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground">
              <th className="text-left px-4 py-2.5 font-medium">Credor</th>
              <th className="text-left px-4 py-2.5 font-medium">Tipo</th>
              <th className="text-right px-4 py-2.5 font-medium">Valor</th>
              <th className="text-left px-4 py-2.5 font-medium">Vencimento</th>
              <th className="text-left px-4 py-2.5 font-medium">Situação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {dividas.map((d) => (
              <tr key={d.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-2.5 font-medium">
                  <div className="flex items-center gap-1.5">
                    {d.negativado && <AlertTriangle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />}
                    {d.credor}
                  </div>
                  {d.numero_contrato && (
                    <p className="text-xs text-muted-foreground">Contrato: {d.numero_contrato}</p>
                  )}
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">{d.tipo || '—'}</td>
                <td className="px-4 py-2.5 text-right font-medium">{formatCurrency(d.valor)}</td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  {d.data_vencimento ? formatDate(d.data_vencimento) : '—'}
                </td>
                <td className="px-4 py-2.5">
                  {d.situacao && (
                    <span className="text-xs px-2 py-0.5 bg-muted rounded-full border border-border">
                      {d.situacao}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="sm:hidden divide-y divide-border">
        {dividas.map((d) => (
          <div key={d.id} className="px-4 py-3 space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium flex items-center gap-1">
                {d.negativado && <AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
                {d.credor}
              </p>
              <p className="text-sm font-semibold">{formatCurrency(d.valor)}</p>
            </div>
            {d.tipo && <p className="text-xs text-muted-foreground">{d.tipo}</p>}
            {d.situacao && <p className="text-xs text-muted-foreground">{d.situacao}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function ClienteCard({
  userId,
  dividas,
  info,
}: {
  userId: string;
  dividas: Divida[];
  info: ClienteInfo | undefined;
}) {
  const [open, setOpen] = useState(true);
  const nome = info?.nome ?? `Cliente ${userId.slice(0, 6)}`;
  const fase = info?.fase ?? 'cadastro';
  const total = dividas.reduce((s, d) => s + (d.valor ?? 0), 0);
  const hasNeg = dividas.some((d) => d.negativado);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
            {nome.split(' ').slice(0, 2).map((w) => w[0]).join('') || '?'}
          </div>
          <div className="text-left">
            <p className="text-sm font-medium">{nome}</p>
            <p className="text-xs text-muted-foreground">
              {dividas.length} dívida{dividas.length !== 1 ? 's' : ''} · Total: {formatCurrency(total)}
              {hasNeg && <span className="ml-2 text-red-600">· Negativado</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={fase} labels={FASE_LABELS} />
          {open ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>
      {open && <DebtTable dividas={dividas} />}
    </div>
  );
}

export default function DividasList({ dividas, clienteMap, isAdmin }: Props) {
  if (isAdmin) {
    const grouped = new Map<string, Divida[]>();
    for (const d of dividas) {
      if (!grouped.has(d.user_id)) grouped.set(d.user_id, []);
      grouped.get(d.user_id)!.push(d);
    }

    return (
      <div className="space-y-3">
        {[...grouped.entries()].map(([userId, ds]) => (
          <ClienteCard key={userId} userId={userId} dividas={ds} info={clienteMap[userId]} />
        ))}
        {grouped.size === 0 && (
          <div className="py-12 flex flex-col items-center gap-2 text-muted-foreground">
            <DollarSign className="h-8 w-8" />
            <p className="text-sm">Nenhuma dívida registrada</p>
          </div>
        )}
      </div>
    );
  }

  if (!dividas.length) {
    return (
      <div className="py-12 flex flex-col items-center gap-2 text-muted-foreground">
        <DollarSign className="h-8 w-8" />
        <p className="text-sm">Nenhuma dívida registrada</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <DebtTable dividas={dividas} />
    </div>
  );
}
