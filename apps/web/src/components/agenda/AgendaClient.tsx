'use client';

import { useState } from 'react';
import { Calendar, Clock, User, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

interface Slot {
  id: string;
  data: string;
  hora: string;
  disponivel: boolean;
  tipo: string | null;
}

interface Agendamento {
  id: string;
  slot_id: string | null;
  status: string;
  nome_cliente: string | null;
  email_cliente: string | null;
  telefone_cliente: string | null;
  tipo_atendimento: string | null;
  observacoes: string | null;
  criado_em: string;
}

interface Props {
  slots: Slot[];
  agendamentos: Agendamento[];
}

const STATUS_STYLE: Record<string, string> = {
  pendente: 'bg-amber-50 text-amber-700 border-amber-200',
  confirmado: 'bg-green-50 text-green-700 border-green-200',
  cancelado: 'bg-red-50 text-red-700 border-red-200',
  concluido: 'bg-teal-50 text-teal-700 border-teal-200',
  remarcado: 'bg-blue-50 text-blue-700 border-blue-200',
};

function formatDate(d: string) {
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

export default function AgendaClient({ slots, agendamentos }: Props) {
  const [tab, setTab] = useState<'agendamentos' | 'slots'>('agendamentos');

  const disponiveis = slots.filter((s) => s.disponivel).length;
  const pendentes = agendamentos.filter((a) => a.status === 'pendente').length;
  const confirmados = agendamentos.filter((a) => a.status === 'confirmado').length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Agenda</h2>
        <p className="text-sm text-muted-foreground">Gestão de agendamentos e disponibilidade</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span className="text-xs font-medium">Pendentes</span>
          </div>
          <p className="text-2xl font-bold">{pendentes}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-xs font-medium">Confirmados</span>
          </div>
          <p className="text-2xl font-bold">{confirmados}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span className="text-xs font-medium">Slots livres</span>
          </div>
          <p className="text-2xl font-bold">{disponiveis}</p>
        </div>
      </div>

      <div className="flex gap-1 border-b border-border">
        {(['agendamentos', 'slots'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px capitalize ${
              tab === t
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t === 'agendamentos' ? 'Agendamentos' : 'Disponibilidade'}
          </button>
        ))}
      </div>

      {tab === 'agendamentos' && (
        <div className="rounded-xl border border-border overflow-hidden">
          {agendamentos.length === 0 ? (
            <p className="px-4 py-8 text-sm text-muted-foreground text-center">Nenhum agendamento encontrado</p>
          ) : (
            <div className="divide-y divide-border">
              {agendamentos.map((a) => (
                <div key={a.id} className="px-4 py-3 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium">{a.nome_cliente ?? 'Cliente'}</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLE[a.status] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                        {a.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{a.tipo_atendimento ?? '—'} · {a.email_cliente}</p>
                    {a.observacoes && <p className="text-xs text-muted-foreground mt-0.5 truncate">{a.observacoes}</p>}
                  </div>
                  <p className="text-xs text-muted-foreground flex-shrink-0">
                    {new Date(a.criado_em).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'slots' && (
        <div className="rounded-xl border border-border overflow-hidden">
          {slots.length === 0 ? (
            <p className="px-4 py-8 text-sm text-muted-foreground text-center">Nenhum slot nos próximos 30 dias</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Data</th>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Hora</th>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Tipo</th>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {slots.map((s) => (
                    <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          {formatDate(s.data)}
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          {s.hora}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">{s.tipo ?? '—'}</td>
                      <td className="px-4 py-2.5">
                        {s.disponivel
                          ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                          : <XCircle className="h-4 w-4 text-red-400" />
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
