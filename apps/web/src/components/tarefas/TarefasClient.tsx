'use client';

import { useState } from 'react';
import { CheckSquare, Clock, AlertTriangle, Filter } from 'lucide-react';

interface Tarefa {
  id: string;
  titulo: string;
  descricao: string | null;
  status: string;
  prioridade: string | null;
  caso_id: string | null;
  responsavel_id: string | null;
  data_vencimento: string | null;
  criado_em: string;
  casos: { nome_cliente: string } | null;
}

interface Props {
  tarefas: Tarefa[];
  userId: string;
}

const PRIORIDADE_STYLE: Record<string, string> = {
  alta: 'bg-red-50 text-red-700 border-red-200',
  media: 'bg-amber-50 text-amber-700 border-amber-200',
  baixa: 'bg-green-50 text-green-700 border-green-200',
};

const STATUS_LABELS: Record<string, string> = {
  pendente: 'Pendente',
  em_andamento: 'Em andamento',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
};

function isOverdue(dateStr: string | null) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

export default function TarefasClient({ tarefas }: Props) {
  const [filtro, setFiltro] = useState<string>('todas');

  const filtered = filtro === 'todas'
    ? tarefas
    : tarefas.filter((t) => t.status === filtro);

  const counts = {
    pendente: tarefas.filter((t) => t.status === 'pendente').length,
    em_andamento: tarefas.filter((t) => t.status === 'em_andamento').length,
    concluida: tarefas.filter((t) => t.status === 'concluida').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Tarefas</h2>
          <p className="text-sm text-muted-foreground">Acompanhamento de atividades e prazos</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="text-xs font-medium">Pendentes</span>
          </div>
          <p className="text-2xl font-bold">{counts.pendente}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-xs font-medium">Em andamento</span>
          </div>
          <p className="text-2xl font-bold">{counts.em_andamento}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CheckSquare className="h-4 w-4" />
            <span className="text-xs font-medium">Concluídas</span>
          </div>
          <p className="text-2xl font-bold">{counts.concluida}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <div className="flex gap-1">
          {(['todas', 'pendente', 'em_andamento', 'concluida'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFiltro(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filtro === s
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {s === 'todas' ? 'Todas' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        {filtered.length === 0 ? (
          <p className="px-4 py-8 text-sm text-muted-foreground text-center">Nenhuma tarefa encontrada</p>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((t) => {
              const overdue = isOverdue(t.data_vencimento) && t.status !== 'concluida' && t.status !== 'cancelada';
              return (
                <div key={t.id} className={`px-4 py-3 ${overdue ? 'bg-red-50/30' : ''}`}>
                  <div className="flex items-start gap-3">
                    <CheckSquare className={`h-4 w-4 mt-0.5 flex-shrink-0 ${t.status === 'concluida' ? 'text-green-500' : 'text-muted-foreground'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`text-sm font-medium ${t.status === 'concluida' ? 'line-through text-muted-foreground' : ''}`}>
                          {t.titulo}
                        </p>
                        {t.prioridade && (
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium border ${PRIORIDADE_STYLE[t.prioridade] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                            {t.prioridade}
                          </span>
                        )}
                        {overdue && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                            <AlertTriangle className="h-3 w-3" /> Vencida
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        {t.casos && <p className="text-xs text-muted-foreground">{t.casos.nome_cliente}</p>}
                        {t.data_vencimento && (
                          <p className={`text-xs ${overdue ? 'text-red-600' : 'text-muted-foreground'}`}>
                            Venc. {new Date(t.data_vencimento).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </div>
                      {t.descricao && <p className="text-xs text-muted-foreground mt-0.5 truncate">{t.descricao}</p>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
