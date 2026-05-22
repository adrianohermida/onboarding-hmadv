import { Sparkles, Brain, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PublicacaoDetalhe } from './types';
import PublicacaoUrgenciaBadge from './PublicacaoUrgenciaBadge';

interface Props {
  publicacao: PublicacaoDetalhe;
}

export default function PublicacaoResumoIA({ publicacao }: Props) {
  const temIA =
    publicacao.ai_resumo ||
    publicacao.ai_tipo_ato ||
    publicacao.ai_urgencia !== 'normal';

  if (!temIA && !publicacao.ai_enriquecido_at) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4 flex items-center gap-3">
        <Brain className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-muted-foreground">Análise IA pendente</p>
          <p className="text-xs text-muted-foreground/70 mt-0.5">
            Esta publicação ainda não foi processada pelo motor de IA jurídica.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-gradient-to-br from-violet-50/50 to-blue-50/50 dark:from-violet-950/20 dark:to-blue-950/20 overflow-hidden">
      <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet-600" />
          <span className="text-sm font-semibold text-violet-900 dark:text-violet-300">Análise IA</span>
        </div>
        {publicacao.ai_enriquecido_at && (
          <span className="text-xs text-muted-foreground">
            {new Date(publicacao.ai_enriquecido_at).toLocaleDateString('pt-BR')}
          </span>
        )}
      </div>

      <div className="p-4 space-y-3">
        {/* Urgência + Tipo Ato */}
        <div className="flex flex-wrap gap-2 items-center">
          <PublicacaoUrgenciaBadge urgencia={publicacao.ai_urgencia} />
          {publicacao.ai_tipo_ato && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-blue-50 text-blue-700 border-blue-200">
              {publicacao.ai_tipo_ato}
            </span>
          )}
          {publicacao.ai_prazo_sugerido && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-amber-50 text-amber-700 border-amber-200">
              <Clock className="h-3 w-3" />
              {publicacao.ai_prazo_sugerido} dias sugeridos
            </span>
          )}
        </div>

        {/* Resumo */}
        {publicacao.ai_resumo && (
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Resumo</p>
            <p className="text-sm leading-relaxed text-foreground">{publicacao.ai_resumo}</p>
          </div>
        )}

        {/* Urgência crítica warning */}
        {(publicacao.ai_urgencia === 'critica' || publicacao.ai_urgencia === 'urgente') && (
          <div className={cn(
            'flex items-start gap-2 rounded-lg p-3',
            publicacao.ai_urgencia === 'critica'
              ? 'bg-red-50 border border-red-200'
              : 'bg-orange-50 border border-orange-200',
          )}>
            <AlertTriangle className={cn(
              'h-4 w-4 flex-shrink-0 mt-0.5',
              publicacao.ai_urgencia === 'critica' ? 'text-red-600' : 'text-orange-600',
            )} />
            <p className={cn(
              'text-xs font-medium',
              publicacao.ai_urgencia === 'critica' ? 'text-red-700' : 'text-orange-700',
            )}>
              {publicacao.ai_urgencia === 'critica'
                ? 'Atenção crítica requerida. Verifique os prazos e providências imediatamente.'
                : 'Esta publicação requer atenção urgente. Verifique o prazo associado.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
