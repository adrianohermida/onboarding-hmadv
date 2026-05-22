'use client';

import { Calendar, MapPin, BookOpen, Clock, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Publicacao } from './types';
import PublicacaoUrgenciaBadge from './PublicacaoUrgenciaBadge';
import PublicacaoStatusBadge from './PublicacaoStatusBadge';

interface Props {
  publicacao: Publicacao;
  selecionada: boolean;
  onClick: () => void;
}

function diasRestantes(dataVenc: string): number {
  const venc = new Date(dataVenc);
  const hoje = new Date();
  return Math.ceil((venc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}

export default function PublicacaoCard({ publicacao, selecionada, onClick }: Props) {
  const prazoAberto = publicacao.prazo_calculado?.find((p) => p.status === 'aberto');
  const dias = prazoAberto ? diasRestantes(prazoAberto.data_vencimento) : null;
  const prazoVencendo = dias !== null && dias <= 5;
  const prazoVencido = dias !== null && dias < 0;

  const numero = publicacao.processos?.numero_cnj ?? publicacao.numero_processo_api;
  const tribunal = publicacao.processos?.tribunal;
  const comarca = publicacao.cidade_comarca_descricao ?? publicacao.processos?.comarca;
  const vara = publicacao.vara_descricao;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-xl border transition-all duration-150',
        'hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
        selecionada
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-border bg-card hover:border-border/80 hover:bg-muted/30',
        !publicacao.lido && !selecionada && 'border-l-2 border-l-blue-400',
      )}
    >
      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {!publicacao.lido && (
                <span className="inline-block w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
              )}
              <span className="text-sm font-semibold truncate">
                {numero ?? 'Processo não vinculado'}
              </span>
              {tribunal && (
                <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">
                  {tribunal}
                </span>
              )}
            </div>
            {publicacao.nome_cliente && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{publicacao.nome_cliente}</p>
            )}
          </div>
          <ChevronRight className={cn(
            'h-4 w-4 flex-shrink-0 mt-0.5 transition-colors',
            selecionada ? 'text-primary' : 'text-muted-foreground',
          )} />
        </div>

        {/* Excerpt */}
        {(publicacao.ai_resumo || publicacao.conteudo) && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2.5 leading-relaxed">
            {publicacao.ai_resumo ?? publicacao.conteudo?.slice(0, 200)}
          </p>
        )}

        {/* Meta */}
        <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground mb-2.5">
          {publicacao.data_publicacao && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(publicacao.data_publicacao).toLocaleDateString('pt-BR')}
            </span>
          )}
          {comarca && (
            <span className="flex items-center gap-1 truncate">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{comarca}</span>
            </span>
          )}
          {vara && (
            <span className="flex items-center gap-1 truncate">
              <BookOpen className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{vara}</span>
            </span>
          )}
        </div>

        {/* Badges row */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <PublicacaoStatusBadge publicacao={publicacao} />
          {publicacao.ai_urgencia && publicacao.ai_urgencia !== 'normal' && (
            <PublicacaoUrgenciaBadge urgencia={publicacao.ai_urgencia} size="sm" />
          )}
          {publicacao.ai_tipo_ato && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs border bg-blue-50 text-blue-700 border-blue-200">
              {publicacao.ai_tipo_ato}
            </span>
          )}
          {prazoAberto && (
            <span className={cn(
              'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium border',
              prazoVencido
                ? 'bg-red-50 text-red-700 border-red-200'
                : prazoVencendo
                  ? 'bg-orange-50 text-orange-700 border-orange-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200',
            )}>
              <Clock className="h-2.5 w-2.5" />
              {prazoVencido
                ? `Vencido há ${Math.abs(dias!)}d`
                : dias === 0
                  ? 'Vence hoje'
                  : `${dias}d restantes`}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
