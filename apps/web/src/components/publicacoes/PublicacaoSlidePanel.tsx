'use client';

import { useEffect, useState } from 'react';
import {
  X, ExternalLink, Building2, MapPin, Scale, BookOpen,
  Clock, Newspaper, Zap, History, FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePublicacaoDetalhe, useMarcarLida } from '@/lib/hooks/use-publicacoes';
import { PublicacaoPanelSkeleton } from './PublicacaoSkeleton';
import PublicacaoUrgenciaBadge from './PublicacaoUrgenciaBadge';
import PublicacaoStatusBadge from './PublicacaoStatusBadge';
import PublicacaoResumoIA from './PublicacaoResumoIA';
import PublicacaoPrazoCard from './PublicacaoPrazoCard';
import PublicacaoTimeline from './PublicacaoTimeline';
import PublicacaoAcoesRapidas from './PublicacaoAcoesRapidas';

type PanelTab = 'conteudo' | 'prazo' | 'timeline' | 'acoes';

const TABS: { id: PanelTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'conteudo', label: 'Publicação', icon: Newspaper },
  { id: 'prazo', label: 'Prazo', icon: Clock },
  { id: 'timeline', label: 'Timeline', icon: History },
  { id: 'acoes', label: 'Ações', icon: Zap },
];

interface Props {
  publicacaoId: string | null;
  onClose: () => void;
  mobile?: boolean;
}

export default function PublicacaoSlidePanel({ publicacaoId, onClose, mobile = false }: Props) {
  const [tab, setTab] = useState<PanelTab>('conteudo');
  const { data: publicacao, isLoading, refetch } = usePublicacaoDetalhe(publicacaoId);
  const { mutate: marcarLida } = useMarcarLida();

  // Auto-mark as read when opened
  useEffect(() => {
    if (publicacao && !publicacao.lido) {
      marcarLida(publicacao.id);
    }
  }, [publicacao?.id, publicacao?.lido, marcarLida]);

  // Reset tab when publication changes
  useEffect(() => {
    setTab('conteudo');
  }, [publicacaoId]);

  if (!publicacaoId) return null;

  const prazoAberto = publicacao?.prazo_calculado?.find((p) => p.status === 'aberto');
  const diasRestantes = prazoAberto
    ? Math.ceil((new Date(prazoAberto.data_vencimento).getTime() - Date.now()) / 86400000)
    : null;

  return (
    <div className={cn(
      'flex flex-col bg-background',
      mobile
        ? 'fixed inset-0 z-50'
        : 'h-full border-l border-border',
    )}>
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border bg-card">
        <div className="flex items-center justify-between px-4 py-3 gap-3">
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="h-5 bg-muted rounded w-48 animate-pulse" />
            ) : publicacao ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold truncate">
                    {publicacao.processos?.numero_cnj ?? publicacao.numero_processo_api ?? 'Sem processo'}
                  </span>
                  {publicacao.processos?.tribunal && (
                    <span className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono text-muted-foreground">
                      {publicacao.processos.tribunal}
                    </span>
                  )}
                </div>
                {publicacao.nome_cliente && (
                  <p className="text-xs text-muted-foreground truncate">{publicacao.nome_cliente}</p>
                )}
              </div>
            ) : null}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Process meta bar */}
        {publicacao && !isLoading && (
          <div className="px-4 pb-3 flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
            {publicacao.processos?.comarca && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {publicacao.processos.comarca}
              </span>
            )}
            {publicacao.processos?.orgao_julgador && (
              <span className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {publicacao.processos.orgao_julgador}
              </span>
            )}
            {publicacao.processos?.classe && (
              <span className="flex items-center gap-1">
                <Scale className="h-3 w-3" />
                {publicacao.processos.classe}
              </span>
            )}
            {publicacao.vara_descricao && (
              <span className="flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                {publicacao.vara_descricao}
              </span>
            )}
          </div>
        )}

        {/* Status badges bar */}
        {publicacao && !isLoading && (
          <div className="px-4 pb-3 flex items-center gap-2 flex-wrap">
            <PublicacaoStatusBadge publicacao={publicacao} />
            <PublicacaoUrgenciaBadge urgencia={publicacao.ai_urgencia} />
            {diasRestantes !== null && (
              <span className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border',
                diasRestantes < 0
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : diasRestantes <= 5
                    ? 'bg-orange-50 text-orange-700 border-orange-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200',
              )}>
                <Clock className="h-3 w-3" />
                {diasRestantes < 0
                  ? `Vencido há ${Math.abs(diasRestantes)}d`
                  : diasRestantes === 0
                    ? 'Vence hoje'
                    : `${diasRestantes}d para o prazo`}
              </span>
            )}
            {publicacao.data_publicacao && (
              <span className="text-xs text-muted-foreground ml-auto">
                {new Date(publicacao.data_publicacao).toLocaleDateString('pt-BR', {
                  day: '2-digit', month: 'long', year: 'numeric',
                })}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex-shrink-0 border-b border-border bg-card">
        <div className="flex overflow-x-auto no-scrollbar">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                tab === t.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border',
              )}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
              {t.id === 'prazo' && publicacao?.prazo_calculado?.length ? (
                <span className="ml-1 w-4 h-4 rounded-full bg-amber-100 text-amber-700 text-xs flex items-center justify-center font-bold">
                  {publicacao.prazo_calculado.length}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <PublicacaoPanelSkeleton />
        ) : !publicacao ? (
          <div className="flex items-center justify-center h-full p-8 text-center">
            <div>
              <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium text-muted-foreground">Publicação não encontrada</p>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {tab === 'conteudo' && (
              <>
                {/* AI Summary */}
                <PublicacaoResumoIA publicacao={publicacao} />

                {/* Diário */}
                {(publicacao.nome_diario || publicacao.nome_caderno_diario) && (
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <BookOpen className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                    <span>
                      {[publicacao.nome_diario, publicacao.nome_caderno_diario]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  </div>
                )}

                {/* Adriano polo */}
                {publicacao.adriano_polo && (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
                    <strong>Polo HMADV:</strong>{' '}
                    {publicacao.adriano_polo === 'AT' ? 'Ativo (Autor)' : 'Passivo (Réu)'}
                  </div>
                )}

                {/* Full content */}
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Conteúdo da publicação
                    </p>
                    {publicacao.ai_tipo_ato && (
                      <span className="text-xs text-muted-foreground">{publicacao.ai_tipo_ato}</span>
                    )}
                  </div>
                  <div className="p-4">
                    {publicacao.conteudo ? (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
                        {publicacao.conteudo}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Conteúdo não disponível.</p>
                    )}
                  </div>
                </div>

                {/* Despacho */}
                {publicacao.despacho && (
                  <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Despacho</p>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{publicacao.despacho}</p>
                  </div>
                )}

                {/* Link externo */}
                {publicacao.processos?.numero_cnj && (
                  <a
                    href={`https://esaj.tjsp.jus.br/cpo/sg/open.do?processo.codigo=${publicacao.processos.numero_cnj}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-primary hover:underline"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Abrir processo no e-SAJ
                  </a>
                )}
              </>
            )}

            {tab === 'prazo' && (
              <PublicacaoPrazoCard publicacao={publicacao} />
            )}

            {tab === 'timeline' && (
              <PublicacaoTimeline
                processoId={publicacao.processo_id}
                publicacaoId={publicacao.id}
                dataPublicacao={publicacao.data_publicacao}
              />
            )}

            {tab === 'acoes' && (
              <PublicacaoAcoesRapidas
                publicacao={publicacao}
                onRefresh={() => refetch()}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
