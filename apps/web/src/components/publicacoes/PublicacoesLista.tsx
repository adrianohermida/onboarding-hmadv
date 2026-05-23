'use client';

import { useRef, useCallback } from 'react';
import { Inbox, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Publicacao, PublicacaoFiltros as PublicacaoFiltrosType, PublicacaoSecao } from './types';
import { usePublicacoes } from '@/lib/hooks/use-publicacoes';
import PublicacaoCard from './PublicacaoCard';
import PublicacaoSkeleton from './PublicacaoSkeleton';
import PublicacaoFiltros from './PublicacaoFiltros';

interface Props {
  secao: PublicacaoSecao;
  filtros: PublicacaoFiltrosType;
  onFiltrosChange: (f: PublicacaoFiltrosType) => void;
  selecionadaId: string | null;
  onSelecionar: (p: Publicacao) => void;
  initialData?: Publicacao[];
}

export default function PublicacoesLista({
  secao,
  filtros,
  onFiltrosChange,
  selecionadaId,
  onSelecionar,
  initialData,
}: Props) {
  const { data: publicacoes, isLoading, isFetching, refetch, isError } = usePublicacoes(
    secao,
    filtros,
    0,
  );

  const listRef = useRef<HTMLDivElement>(null);

  const items = publicacoes ?? initialData ?? [];

  const handleScroll = useCallback(() => {
    // Infinite scroll hook point — pagination can be added here
  }, []);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Filters */}
      <div className="flex-shrink-0 p-3 border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-10">
        <PublicacaoFiltros filtros={filtros} onChange={onFiltrosChange} />
      </div>

      {/* Count + refresh */}
      <div className="flex-shrink-0 flex items-center justify-between px-3 py-2 border-b border-border bg-muted/20">
        <span className="text-xs text-muted-foreground">
          {isLoading ? 'Carregando...' : `${items.length} publicação${items.length !== 1 ? 'ões' : ''}`}
        </span>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} />
        </button>
      </div>

      {/* List */}
      <div
        ref={listRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0"
      >
        {isLoading && !initialData?.length ? (
          <PublicacaoSkeleton />
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-sm font-medium text-muted-foreground">Erro ao carregar publicações</p>
            <p className="text-xs text-muted-foreground/70">
              Verifique se o schema <code className="px-1 py-0.5 bg-muted rounded text-xs">judiciario</code> está exposto na API do Supabase.
            </p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90"
            >
              Tentar novamente
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
              <Inbox className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nenhuma publicação</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Tente ajustar os filtros ou mudar a seção.
              </p>
            </div>
          </div>
        ) : (
          <>
            {items.map((p) => (
              <PublicacaoCard
                key={p.id}
                publicacao={p}
                selecionada={selecionadaId === p.id}
                onClick={() => onSelecionar(p)}
              />
            ))}
            {isFetching && !isLoading && (
              <div className="flex justify-center py-3">
                <RefreshCw className="h-4 w-4 text-muted-foreground animate-spin" />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
