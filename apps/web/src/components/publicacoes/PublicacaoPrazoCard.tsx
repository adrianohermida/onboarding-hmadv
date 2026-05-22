'use client';

import {
  Clock, Calendar, AlertTriangle, CheckCircle2, BookOpen,
  Scale, Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PrazoCalculado, PublicacaoDetalhe } from './types';

interface Props {
  publicacao: PublicacaoDetalhe;
}

function diasRestantes(dataVenc: string): number {
  const venc = new Date(dataVenc);
  const hoje = new Date();
  return Math.ceil((venc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function PrazoItem({ prazo }: { prazo: PrazoCalculado }) {
  const dias = diasRestantes(prazo.data_vencimento);
  const vencido = dias < 0;
  const vencendo = dias >= 0 && dias <= 5;
  const concluido = prazo.status === 'concluido' || prazo.status === 'concluída';

  const colorClass = concluido
    ? 'border-green-200 bg-green-50/50'
    : vencido
      ? 'border-red-200 bg-red-50/50'
      : vencendo
        ? 'border-orange-200 bg-orange-50/50'
        : 'border-border bg-card';

  const prazoColor = concluido
    ? 'text-green-700'
    : vencido
      ? 'text-red-700'
      : vencendo
        ? 'text-orange-700'
        : 'text-amber-700';

  return (
    <div className={cn('rounded-xl border p-4 space-y-3', colorClass)}>
      {/* Titulo + status */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="text-sm font-semibold">{prazo.titulo}</p>
          {prazo.observacoes_ia && (
            <p className="text-xs text-muted-foreground mt-0.5">{prazo.observacoes_ia}</p>
          )}
        </div>
        <span className={cn(
          'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border flex-shrink-0',
          concluido
            ? 'bg-green-50 text-green-700 border-green-200'
            : vencido
              ? 'bg-red-50 text-red-700 border-red-200'
              : vencendo
                ? 'bg-orange-50 text-orange-700 border-orange-200'
                : 'bg-amber-50 text-amber-700 border-amber-200',
        )}>
          {concluido ? (
            <><CheckCircle2 className="h-3 w-3 mr-1" />Concluído</>
          ) : vencido ? (
            <><AlertTriangle className="h-3 w-3 mr-1" />Vencido</>
          ) : (
            <><Clock className="h-3 w-3 mr-1" />{prazo.status}</>
          )}
        </span>
      </div>

      {/* Contagem */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-background/80 p-2">
          <p className="text-xs text-muted-foreground">Início contagem</p>
          <p className="text-xs font-medium mt-0.5">
            {formatDate(prazo.data_inicio_contagem)}
          </p>
        </div>
        <div className="rounded-lg bg-background/80 p-2">
          <p className="text-xs text-muted-foreground">Vencimento</p>
          <p className="text-xs font-medium mt-0.5">
            {formatDate(prazo.data_vencimento)}
          </p>
        </div>
        <div className={cn('rounded-lg p-2', vencido ? 'bg-red-100' : vencendo ? 'bg-orange-100' : 'bg-background/80')}>
          <p className="text-xs text-muted-foreground">Restam</p>
          <p className={cn('text-sm font-bold mt-0.5', prazoColor)}>
            {concluido ? '—' : vencido ? `−${Math.abs(dias)}d` : `${dias}d`}
          </p>
        </div>
      </div>

      {/* Regra aplicada */}
      {prazo.prazo_regra && (
        <div className="border-t border-border/60 pt-3 space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Scale className="h-3 w-3" />
            Fundamento legal
          </p>
          <p className="text-xs font-medium">{prazo.prazo_regra.ato_praticado}</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {prazo.prazo_regra.base_legal && (
              <span className="flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                {prazo.prazo_regra.base_legal}
                {prazo.prazo_regra.artigo && `, ${prazo.prazo_regra.artigo}`}
              </span>
            )}
            <span>{prazo.prazo_regra.prazo_dias} dias ({prazo.prazo_regra.tipo_contagem.replace('_', ' ')})</span>
          </div>
        </div>
      )}

      {/* Prioridade */}
      {prazo.prioridade && (
        <div className="flex items-center gap-1.5">
          <Info className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Prioridade: {prazo.prioridade}</span>
        </div>
      )}
    </div>
  );
}

export default function PublicacaoPrazoCard({ publicacao }: Props) {
  const prazos = publicacao.prazo_calculado ?? [];

  if (prazos.length === 0) {
    return (
      <div className="space-y-3">
        {/* AI sugestão de prazo */}
        {publicacao.ai_prazo_sugerido && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 flex items-start gap-3">
            <Clock className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-900">Prazo sugerido pela IA</p>
              <p className="text-sm text-amber-800 mt-0.5">
                {publicacao.ai_prazo_sugerido} dias a partir da publicação
              </p>
              {publicacao.data_publicacao && (
                <p className="text-xs text-amber-700 mt-1">
                  Vencimento estimado:{' '}
                  {(() => {
                    const d = new Date(publicacao.data_publicacao);
                    d.setDate(d.getDate() + publicacao.ai_prazo_sugerido!);
                    return d.toLocaleDateString('pt-BR');
                  })()}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="rounded-xl border border-dashed border-border p-6 text-center">
          <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-medium text-muted-foreground">Nenhum prazo calculado</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Use "Gerar Prazo" nas ações rápidas para criar um prazo a partir das regras jurídicas.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {prazos.map((p) => (
        <PrazoItem key={p.id} prazo={p} />
      ))}
    </div>
  );
}
