'use client';

import { useEffect, useState } from 'react';
import {
  X, ExternalLink, Clock, Newspaper, Zap, History,
  FileText, Eye, EyeOff, MessageSquare, Loader2, CheckCircle2,
  Calculator, Link2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  usePublicacaoDetalhe, useMarcarLida, useMarcarNaoLida,
  useSalvarComentario, useCalcularPrazoAutomatico, useCriarProcessoPublicacao,
} from '@/lib/hooks/use-publicacoes';
import { PublicacaoPanelSkeleton } from './PublicacaoSkeleton';
import PublicacaoUrgenciaBadge from './PublicacaoUrgenciaBadge';
import PublicacaoStatusBadge from './PublicacaoStatusBadge';
import PublicacaoPrazoCard from './PublicacaoPrazoCard';
import PublicacaoTimeline from './PublicacaoTimeline';
import PublicacaoAcoesRapidas from './PublicacaoAcoesRapidas';
import type { PublicacaoDetalhe } from './types';

type PanelTab = 'publicacao' | 'prazo' | 'timeline' | 'acoes';

const TABS: { id: PanelTab; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'publicacao', label: 'Publicação', Icon: Newspaper },
  { id: 'prazo',      label: 'Prazo',      Icon: Clock },
  { id: 'timeline',  label: 'Timeline',   Icon: History },
  { id: 'acoes',     label: 'Ações',      Icon: Zap },
];

interface Props {
  publicacaoId: string | null;
  onClose: () => void;
  mobile?: boolean;
}

function fmtData(iso: string | null, opts?: Intl.DateTimeFormatOptions) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', opts ?? { day: '2-digit', month: 'long', year: 'numeric' });
}

// One labelled row in the info grid
function InfoRow({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex gap-3 py-2 border-b border-border/50 last:border-0">
      <span className="w-36 flex-shrink-0 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide pt-0.5">
        {label}
      </span>
      <span className={cn('flex-1 text-sm text-foreground break-words', mono && 'font-mono text-xs')}>
        {value ?? '—'}
      </span>
    </div>
  );
}

// Structured field grid for the "Publicação" tab
function CamposPublicacao({ pub }: { pub: PublicacaoDetalhe }) {
  const numeroCnj = pub.processos?.numero_cnj ?? pub.numero_processo_api;

  return (
    <div className="rounded-xl border border-border bg-card divide-y divide-border/50 overflow-hidden">
      <InfoRow label="Diário"          value={pub.nome_diario} />
      <InfoRow label="Processo"        value={
        numeroCnj
          ? <span className="font-mono text-xs">{numeroCnj}</span>
          : <span className="text-muted-foreground italic text-xs">Sem processo vinculado</span>
      } />
      <InfoRow label="Publicação em"   value={fmtData(pub.data_publicacao)} />
      <InfoRow label="Disponibilização" value={fmtData(pub.data_disponibilizacao ?? pub.data_hora_cadastro)} />
      <InfoRow label="Comarca"         value={pub.cidade_comarca_descricao ?? pub.processos?.comarca} />
      <InfoRow label="Vara"            value={pub.vara_descricao ?? pub.processos?.orgao_julgador} />
      <InfoRow label="Caderno"         value={pub.nome_caderno_diario} />
      <InfoRow label="Contratante"     value={pub.nome_cliente} />
      <InfoRow label="Edição"          value={pub.numero_edicao} />
      <InfoRow label="Página inicial"  value={pub.pagina_inicial} />
      <InfoRow label="Página final"    value={pub.pagina_final} />
      <InfoRow label="Palavra-chave"   value={pub.palavras_chave} />
    </div>
  );
}

// Despacho section
function SecaoDespacho({ despacho }: { despacho: string | null }) {
  if (!despacho) return null;
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border bg-muted/30">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Despacho</p>
      </div>
      <p className="px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap">{despacho}</p>
    </div>
  );
}

// Conteúdo section
function SecaoConteudo({ conteudo, tipoAto }: { conteudo: string | null; tipoAto: string | null }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border bg-muted/30 flex items-center justify-between">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Conteúdo</p>
        {tipoAto && <span className="text-[10px] text-muted-foreground">{tipoAto}</span>}
      </div>
      <div className="px-4 py-3">
        {conteudo
          ? <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">{conteudo}</p>
          : <p className="text-sm text-muted-foreground italic">Conteúdo não disponível.</p>}
      </div>
    </div>
  );
}

// CTAs strip: Calcular Prazo + Marcar como não lido
function CtaStrip({ pub, onRefresh }: { pub: PublicacaoDetalhe; onRefresh: () => void }) {
  const { mutate: marcarNaoLida, isPending: desmarcando } = useMarcarNaoLida();
  const calcular = useCalcularPrazoAutomatico();
  const criarProcesso = useCriarProcessoPublicacao();
  const [prazoOk, setPrazoOk] = useState(false);
  const [processoOk, setProcessoOk] = useState(false);
  const [numeroCnj, setNumeroCnj] = useState(pub.numero_processo_api ?? '');

  async function handleCalcularPrazo() {
    if (!pub.processo_id) return;
    await calcular.mutateAsync({
      publicacaoId: pub.id,
      processoId: pub.processo_id,
      comarca: pub.cidade_comarca_descricao ?? pub.processos?.comarca,
      vara: pub.vara_descricao ?? pub.processos?.orgao_julgador,
      dataPublicacao: pub.data_publicacao,
      dataDisponibilizacao: pub.data_disponibilizacao ?? pub.data_hora_cadastro,
      conteudo: pub.conteudo,
      aiPrazoSugerido: pub.ai_prazo_sugerido,
    });
    setPrazoOk(true);
    onRefresh();
  }

  async function handleCriarProcesso(e: React.FormEvent) {
    e.preventDefault();
    if (!numeroCnj.trim()) return;
    await criarProcesso.mutateAsync({
      publicacaoId: pub.id,
      numeroCnj: numeroCnj.trim(),
      comarca: pub.cidade_comarca_descricao,
      vara: pub.vara_descricao,
      classe: pub.processos?.classe,
    });
    setProcessoOk(true);
    onRefresh();
  }

  return (
    <div className="space-y-3">
      {/* Row 1: Calcular prazo */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleCalcularPrazo}
          disabled={calcular.isPending || !pub.processo_id || prazoOk}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors flex-1',
            prazoOk
              ? 'bg-green-50 border-green-200 text-green-700'
              : pub.processo_id
                ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                : 'bg-muted border-border text-muted-foreground cursor-not-allowed',
          )}
        >
          {calcular.isPending
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : prazoOk
              ? <CheckCircle2 className="h-4 w-4" />
              : <Calculator className="h-4 w-4" />}
          {prazoOk ? 'Prazo calculado!' : 'Calcular Prazo'}
        </button>

        {/* Marcar como não lido */}
        {pub.lido && (
          <button
            onClick={() => marcarNaoLida(pub.id, { onSuccess: onRefresh })}
            disabled={desmarcando}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-border bg-card hover:bg-muted/40 text-muted-foreground transition-colors"
          >
            {desmarcando ? <Loader2 className="h-4 w-4 animate-spin" /> : <EyeOff className="h-4 w-4" />}
            Não lida
          </button>
        )}
        {!pub.lido && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground px-2">
            <Eye className="h-3.5 w-3.5" /> Não lida
          </span>
        )}
      </div>

      {/* Processo vinculação inline (when no process) */}
      {!pub.processo_id && (
        <form onSubmit={handleCriarProcesso} className="rounded-xl border border-blue-200 bg-blue-50/50 p-3 space-y-2">
          <p className="text-xs font-semibold text-blue-800 flex items-center gap-1.5">
            <Link2 className="h-3.5 w-3.5" /> Associar processo
          </p>
          <div className="flex gap-2">
            <input
              value={numeroCnj}
              onChange={(e) => setNumeroCnj(e.target.value)}
              placeholder="Nº CNJ (0000000-00.0000.0.00.0000)"
              className="flex-1 px-3 py-1.5 text-xs bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <button
              type="submit"
              disabled={criarProcesso.isPending || !numeroCnj.trim() || processoOk}
              className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {criarProcesso.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : processoOk ? '✓' : 'Criar'}
            </button>
          </div>
          {criarProcesso.isError && (
            <p className="text-xs text-red-600">Erro ao criar processo. Verifique o número CNJ.</p>
          )}
        </form>
      )}

      {!pub.processo_id && (
        <p className="text-[11px] text-muted-foreground text-center">
          Vincule um processo para habilitar o cálculo de prazo.
        </p>
      )}
    </div>
  );
}

// Comment section
function SecaoComentario({ pub }: { pub: PublicacaoDetalhe }) {
  const [texto, setTexto] = useState(pub.comentario ?? '');
  const [saved, setSaved] = useState(false);
  const { mutate: salvar, isPending } = useSalvarComentario();

  // Sync if publication changes
  useEffect(() => {
    setTexto(pub.comentario ?? '');
    setSaved(false);
  }, [pub.id, pub.comentario]);

  function handleSave() {
    salvar(
      { id: pub.id, comentario: texto },
      { onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 3000); } },
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border bg-muted/30 flex items-center gap-2">
        <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Comentário interno</p>
        {saved && (
          <span className="ml-auto text-[10px] text-green-600 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Salvo
          </span>
        )}
      </div>
      <div className="p-3 space-y-2">
        <textarea
          value={texto}
          onChange={(e) => { setTexto(e.target.value); setSaved(false); }}
          placeholder="Adicione uma anotação interna sobre esta publicação..."
          rows={3}
          className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
        />
        <button
          onClick={handleSave}
          disabled={isPending || texto === (pub.comentario ?? '')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          {isPending ? 'Salvando...' : 'Salvar comentário'}
        </button>
      </div>
    </div>
  );
}

export default function PublicacaoSlidePanel({ publicacaoId, onClose, mobile = false }: Props) {
  const [tab, setTab] = useState<PanelTab>('publicacao');
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
    setTab('publicacao');
  }, [publicacaoId]);

  if (!publicacaoId) return null;

  const prazoAberto = publicacao?.prazo_calculado?.find((p) => p.status === 'aberto');
  const diasRestantes = prazoAberto
    ? Math.ceil((new Date(prazoAberto.data_vencimento).getTime() - Date.now()) / 86400000)
    : null;

  return (
    <div className={cn(
      'flex flex-col bg-background',
      mobile ? 'fixed inset-0 z-50' : 'h-full border-l border-border',
    )}>
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border bg-card">
        <div className="flex items-center justify-between px-4 py-3 gap-3">
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="h-5 bg-muted rounded w-48 animate-pulse" />
            ) : publicacao ? (
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold truncate font-mono">
                    {publicacao.processos?.numero_cnj ?? publicacao.numero_processo_api ?? 'Sem processo'}
                  </span>
                  {publicacao.processos?.tribunal && (
                    <span className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono text-muted-foreground">
                      {publicacao.processos.tribunal}
                    </span>
                  )}
                  {publicacao.adriano_polo && (
                    <span className={cn(
                      'text-xs px-1.5 py-0.5 rounded font-medium',
                      publicacao.adriano_polo === 'AT'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-orange-100 text-orange-700',
                    )}>
                      {publicacao.adriano_polo === 'AT' ? 'Ativo' : 'Passivo'}
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

        {/* Status badges + deadline */}
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
                    : `${diasRestantes}d restantes`}
              </span>
            )}
            {publicacao.processos?.numero_cnj && (
              <a
                href={`https://esaj.tjsp.jus.br/cpo/sg/open.do?processo.codigo=${publicacao.processos.numero_cnj}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3" /> e-SAJ
              </a>
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
              <t.Icon className="h-3.5 w-3.5" />
              {t.label}
              {t.id === 'prazo' && (publicacao?.prazo_calculado?.length ?? 0) > 0 && (
                <span className="ml-1 min-w-[18px] h-[18px] rounded-full bg-amber-100 text-amber-700 text-[10px] flex items-center justify-center font-bold px-1">
                  {publicacao!.prazo_calculado.length}
                </span>
              )}
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
            {/* === TAB: Publicação === */}
            {tab === 'publicacao' && (
              <>
                {/* Structured field grid */}
                <CamposPublicacao pub={publicacao} />

                {/* Despacho */}
                <SecaoDespacho despacho={publicacao.despacho} />

                {/* Conteúdo */}
                <SecaoConteudo conteudo={publicacao.conteudo} tipoAto={publicacao.ai_tipo_ato} />

                {/* CTAs: Calcular Prazo + Marcar não lida + Associar processo */}
                <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Ações rápidas</p>
                  <CtaStrip pub={publicacao} onRefresh={() => refetch()} />
                </div>

                {/* Comentário interno */}
                <SecaoComentario pub={publicacao} />
              </>
            )}

            {/* === TAB: Prazo === */}
            {tab === 'prazo' && (
              <PublicacaoPrazoCard publicacao={publicacao} />
            )}

            {/* === TAB: Timeline === */}
            {tab === 'timeline' && (
              <PublicacaoTimeline
                processoId={publicacao.processo_id}
                publicacaoId={publicacao.id}
                dataPublicacao={publicacao.data_publicacao}
              />
            )}

            {/* === TAB: Ações === */}
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
