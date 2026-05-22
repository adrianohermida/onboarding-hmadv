'use client';

import { Gavel, Calendar, Newspaper, FileText, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePublicacaoTimeline } from '@/lib/hooks/use-publicacoes';
import type { Movimento, Audiencia, Parte } from './types';

interface Props {
  processoId: string | null;
  publicacaoId: string;
  dataPublicacao: string | null;
}

interface EventoTimeline {
  id: string;
  data: string | null;
  tipo: 'movimento' | 'audiencia' | 'publicacao';
  titulo: string;
  descricao?: string | null;
  cor: string;
  Icone: React.ComponentType<{ className?: string }>;
}

function formatDateTime(d: string) {
  return new Date(d).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function poloLabel(polo: string | null) {
  if (!polo) return '';
  if (polo === 'AT' || polo === 'ativo') return 'Ativo';
  if (polo === 'PA' || polo === 'passivo') return 'Passivo';
  return polo;
}

export default function PublicacaoTimeline({ processoId, publicacaoId, dataPublicacao }: Props) {
  const { data, isLoading } = usePublicacaoTimeline(processoId);

  if (!processoId) {
    return (
      <div className="rounded-xl border border-dashed border-border p-6 text-center">
        <Gavel className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Sem processo vinculado</p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          Vincule um processo para visualizar a timeline completa.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-muted flex-shrink-0 mt-0.5" />
            <div className="flex-1 pb-4 border-l border-border/50 pl-3 space-y-1.5">
              <div className="h-3.5 bg-muted rounded w-2/3" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const movimentos = data?.movimentos ?? [];
  const audiencias = data?.audiencias ?? [];
  const partes = data?.partes ?? [];

  // Build unified timeline events
  const eventos: EventoTimeline[] = [
    // Current publication
    {
      id: publicacaoId,
      data: dataPublicacao,
      tipo: 'publicacao',
      titulo: 'Esta publicação',
      descricao: 'Publicação atual em análise',
      cor: 'bg-blue-500',
      Icone: Newspaper,
    },
    // Movements
    ...(movimentos as Movimento[]).map((m) => ({
      id: m.id,
      data: m.data_movimento,
      tipo: 'movimento' as const,
      titulo: m.descricao ?? `Movimento ${m.codigo ?? ''}`,
      cor: 'bg-gray-400',
      Icone: FileText,
    })),
    // Audiencias
    ...(audiencias as Audiencia[]).map((a) => ({
      id: a.id,
      data: a.data_audiencia,
      tipo: 'audiencia' as const,
      titulo: a.tipo ?? 'Audiência',
      descricao: a.descricao,
      cor: a.situacao === 'realizada' ? 'bg-green-500' : 'bg-purple-500',
      Icone: Calendar,
    })),
  ];

  // Sort by date descending
  eventos.sort((a, b) => {
    if (!a.data && !b.data) return 0;
    if (!a.data) return 1;
    if (!b.data) return -1;
    return new Date(b.data).getTime() - new Date(a.data).getTime();
  });

  return (
    <div className="space-y-4">
      {/* Partes section */}
      {partes.length > 0 && (
        <div className="rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-semibold">Partes do processo</p>
          </div>
          <div className="space-y-1.5">
            {(partes as Parte[]).slice(0, 8).map((p) => (
              <div key={p.id} className="flex items-center gap-2 text-xs">
                <span className={cn(
                  'inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0',
                  p.polo === 'AT' || p.polo === 'ativo'
                    ? 'bg-blue-50 text-blue-700'
                    : 'bg-red-50 text-red-700',
                )}>
                  {poloLabel(p.polo)}
                </span>
                <span className={cn('font-medium', p.cliente_hmadv && 'text-primary')}>
                  {p.nome}
                </span>
                {p.tipo && <span className="text-muted-foreground">({p.tipo})</span>}
                {p.representada_pelo_escritorio && (
                  <span className="text-xs text-green-600 font-medium">✓ HMADV</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      {eventos.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Nenhum evento encontrado para este processo.
        </p>
      ) : (
        <div className="relative">
          {eventos.map((evento, idx) => (
            <div key={evento.id} className="flex gap-3 pb-4">
              {/* Connector */}
              <div className="flex flex-col items-center">
                <div className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0',
                  evento.tipo === 'publicacao'
                    ? 'bg-blue-500 ring-4 ring-blue-100'
                    : evento.tipo === 'audiencia'
                      ? 'bg-purple-500'
                      : 'bg-gray-300',
                )}>
                  <evento.Icone className="h-3 w-3 text-white" />
                </div>
                {idx < eventos.length - 1 && (
                  <div className="w-px flex-1 bg-border mt-1" />
                )}
              </div>

              {/* Content */}
              <div className={cn('flex-1 min-w-0 pb-1', evento.tipo === 'publicacao' && 'font-medium')}>
                <div className="flex items-start justify-between gap-2">
                  <p className={cn(
                    'text-sm',
                    evento.tipo === 'publicacao'
                      ? 'font-semibold text-blue-700'
                      : 'font-medium',
                  )}>
                    {evento.titulo}
                  </p>
                  {evento.data && (
                    <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                      {formatDateTime(evento.data)}
                    </span>
                  )}
                </div>
                {evento.descricao && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {evento.descricao}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
