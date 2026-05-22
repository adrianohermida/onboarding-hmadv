import { cn } from '@/lib/utils';
import { Flame, AlertTriangle, AlertCircle, Minus } from 'lucide-react';
import { URGENCIA_LABELS, URGENCIA_STYLES } from './types';

interface Props {
  urgencia: string | null;
  size?: 'sm' | 'md';
  className?: string;
}

const URGENCIA_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  normal: Minus,
  media: AlertCircle,
  alta: AlertTriangle,
  urgente: Flame,
  critica: Flame,
};

export default function PublicacaoUrgenciaBadge({ urgencia, size = 'md', className }: Props) {
  const key = urgencia ?? 'normal';
  const label = URGENCIA_LABELS[key] ?? key;
  const style = URGENCIA_STYLES[key] ?? URGENCIA_STYLES.normal;
  const Icon = URGENCIA_ICON[key] ?? Minus;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-medium',
        size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-0.5 text-xs',
        style,
        className,
      )}
    >
      <Icon className={size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3'} />
      {label}
    </span>
  );
}
