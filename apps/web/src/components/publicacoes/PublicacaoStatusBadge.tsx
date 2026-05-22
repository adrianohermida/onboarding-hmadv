import { cn } from '@/lib/utils';
import type { Publicacao } from './types';

interface Props {
  publicacao: Pick<Publicacao, 'lido' | 'ativo' | 'ai_urgencia' | 'tem_prazo'>;
  className?: string;
}

export type StatusDerived = 'pendente' | 'lida' | 'urgente' | 'prazo_aberto' | 'arquivada';

export function deriveStatus(p: Pick<Publicacao, 'lido' | 'ativo' | 'ai_urgencia' | 'tem_prazo'>): StatusDerived {
  if (!p.ativo) return 'arquivada';
  if (p.ai_urgencia === 'urgente' || p.ai_urgencia === 'critica' || p.ai_urgencia === 'alta') return 'urgente';
  if (p.tem_prazo) return 'prazo_aberto';
  if (p.lido) return 'lida';
  return 'pendente';
}

const STATUS_CONFIG: Record<StatusDerived, { label: string; style: string }> = {
  pendente: { label: 'Pendente', style: 'bg-blue-50 text-blue-700 border-blue-200' },
  lida: { label: 'Lida', style: 'bg-gray-100 text-gray-600 border-gray-200' },
  urgente: { label: 'Urgente', style: 'bg-orange-50 text-orange-700 border-orange-200' },
  prazo_aberto: { label: 'Prazo Aberto', style: 'bg-amber-50 text-amber-700 border-amber-200' },
  arquivada: { label: 'Arquivada', style: 'bg-gray-50 text-gray-400 border-gray-200' },
};

export default function PublicacaoStatusBadge({ publicacao, className }: Props) {
  const status = deriveStatus(publicacao);
  const { label, style } = STATUS_CONFIG[status];

  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border', style, className)}>
      {label}
    </span>
  );
}
