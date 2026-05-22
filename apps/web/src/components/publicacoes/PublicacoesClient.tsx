'use client';

import { useState, useCallback } from 'react';
import {
  Inbox, Clock, Flame, BookOpen, Archive,
  Cpu, Unlink, LayoutList, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Publicacao, PublicacaoFiltros, PublicacaoSecao } from './types';
import { SECAO_LABELS, FILTROS_DEFAULT } from './types';
import PublicacoesLista from './PublicacoesLista';
import PublicacaoSlidePanel from './PublicacaoSlidePanel';
import { usePublicacoesCount } from '@/lib/hooks/use-publicacoes';

interface Props {
  initialData: Publicacao[];
  isAdmin: boolean;
}

interface SecaoConfig {
  id: PublicacaoSecao;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const SECOES: SecaoConfig[] = [
  { id: 'caixa_entrada', label: 'Caixa de Entrada', icon: Inbox },
  { id: 'com_prazo', label: 'Com Prazo', icon: Clock },
  { id: 'urgentes', label: 'Urgentes', icon: Flame },
  { id: 'lidas', label: 'Lidas', icon: BookOpen },
  { id: 'pendentes', label: 'Pendentes', icon: LayoutList },
  { id: 'arquivadas', label: 'Arquivadas', icon: Archive },
  { id: 'triagem_ia', label: 'Triagem IA', icon: Cpu, adminOnly: true },
  { id: 'sem_vinculo', label: 'Sem Vínculo', icon: Unlink, adminOnly: true },
];

function SecaoNavItem({
  secao,
  ativa,
  onClick,
}: {
  secao: SecaoConfig;
  ativa: boolean;
  onClick: () => void;
}) {
  const { data: count } = usePublicacoesCount(secao.id);

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left',
        ativa
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
      )}
    >
      <secao.icon className={cn('h-4 w-4 flex-shrink-0', ativa && 'text-primary')} />
      <span className="flex-1 truncate">{secao.label}</span>
      {count != null && count > 0 && (
        <span className={cn(
          'flex-shrink-0 min-w-[18px] h-[18px] px-1 rounded-full text-xs font-bold flex items-center justify-center',
          ativa
            ? 'bg-primary text-primary-foreground'
            : secao.id === 'urgentes'
              ? 'bg-red-100 text-red-700'
              : secao.id === 'com_prazo'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-muted text-muted-foreground',
        )}>
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
}

export default function PublicacoesClient({ initialData, isAdmin }: Props) {
  const [secao, setSecao] = useState<PublicacaoSecao>('caixa_entrada');
  const [filtros, setFiltros] = useState<PublicacaoFiltros>(FILTROS_DEFAULT);
  const [selecionada, setSelecionada] = useState<Publicacao | null>(null);
  const [mobilePanel, setMobilePanel] = useState(false);
  const [navMobile, setNavMobile] = useState(false);

  const visibleSecoes = SECOES.filter((s) => !s.adminOnly || isAdmin);

  const handleSelecionar = useCallback((p: Publicacao) => {
    setSelecionada(p);
    setMobilePanel(true);
  }, []);

  const handleFecharPanel = useCallback(() => {
    setSelecionada(null);
    setMobilePanel(false);
  }, []);

  const handleSecao = useCallback((s: PublicacaoSecao) => {
    setSecao(s);
    setSelecionada(null);
    setNavMobile(false);
  }, []);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Page header */}
      <div className="flex-shrink-0 flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold">Publicações Jurídicas</h1>
          <p className="text-sm text-muted-foreground">
            {SECAO_LABELS[secao]} · Central de intimações e publicações processuais
          </p>
        </div>
        {/* Mobile nav toggle */}
        <button
          onClick={() => setNavMobile(true)}
          className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground"
        >
          <LayoutList className="h-4 w-4" />
          Seções
        </button>
      </div>

      {/* Main layout */}
      <div className="flex-1 flex gap-0 min-h-0 rounded-xl border border-border overflow-hidden bg-background">

        {/* Left nav — desktop */}
        <aside className="hidden lg:flex flex-col w-52 flex-shrink-0 border-r border-border bg-card/50">
          <div className="flex-shrink-0 px-3 pt-3 pb-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1">
              Seções
            </p>
          </div>
          <nav className="flex-1 overflow-y-auto p-2 space-y-0.5 no-scrollbar">
            {visibleSecoes.map((s) => (
              <SecaoNavItem
                key={s.id}
                secao={s}
                ativa={secao === s.id}
                onClick={() => handleSecao(s.id)}
              />
            ))}
          </nav>
        </aside>

        {/* Center: list */}
        <div className={cn(
          'flex-1 min-w-0 border-r border-border',
          selecionada ? 'hidden lg:flex lg:flex-col' : 'flex flex-col',
        )}>
          <PublicacoesLista
            secao={secao}
            filtros={filtros}
            onFiltrosChange={setFiltros}
            selecionadaId={selecionada?.id ?? null}
            onSelecionar={handleSelecionar}
            initialData={secao === 'caixa_entrada' ? initialData : undefined}
          />
        </div>

        {/* Right: detail panel — desktop */}
        {selecionada ? (
          <div className="hidden lg:flex flex-col w-[480px] xl:w-[540px] flex-shrink-0">
            <PublicacaoSlidePanel
              publicacaoId={selecionada.id}
              onClose={handleFecharPanel}
            />
          </div>
        ) : (
          <div className="hidden lg:flex flex-col flex-1 max-w-[540px] items-center justify-center text-center p-8 text-muted-foreground">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Inbox className="h-8 w-8 text-muted-foreground/60" />
            </div>
            <p className="text-sm font-medium">Selecione uma publicação</p>
            <p className="text-xs mt-1 opacity-70">
              Clique em uma publicação na lista para ver os detalhes completos,
              prazos e ações disponíveis.
            </p>
          </div>
        )}
      </div>

      {/* Mobile: section nav drawer */}
      {navMobile && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setNavMobile(false)}
          />
          <div className="lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border flex flex-col animate-slide-in-left">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <p className="text-sm font-semibold">Seções</p>
              <button onClick={() => setNavMobile(false)}>
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
              {visibleSecoes.map((s) => (
                <SecaoNavItem
                  key={s.id}
                  secao={s}
                  ativa={secao === s.id}
                  onClick={() => handleSecao(s.id)}
                />
              ))}
            </nav>
          </div>
        </>
      )}

      {/* Mobile: full-screen panel */}
      {mobilePanel && selecionada && (
        <div className="lg:hidden fixed inset-0 z-50 bg-background animate-slide-in-right">
          <PublicacaoSlidePanel
            publicacaoId={selecionada.id}
            onClose={handleFecharPanel}
            mobile
          />
        </div>
      )}
    </div>
  );
}
