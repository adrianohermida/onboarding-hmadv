import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  label: string;
  value: number | string | null | undefined;
  icon: LucideIcon;
  iconCls?: string;
  bgCls?: string;
  href?: string;
  loading?: boolean;
  trend?: { value: number; label: string };
  className?: string;
}

function Skeleton() {
  return <div className="h-8 w-12 rounded bg-muted animate-pulse" />;
}

export default function KpiCard({
  label, value, icon: Icon, iconCls = 'text-primary', bgCls = 'bg-primary/10',
  href, loading, trend, className,
}: KpiCardProps) {
  const content = (
    <div className={cn(
      'bg-card border border-border rounded-xl p-4 transition-colors',
      href && 'hover:border-primary/40 hover:bg-muted/30 cursor-pointer',
      className,
    )}>
      <div className={cn('inline-flex p-2 rounded-lg mb-3', bgCls)}>
        <Icon className={cn('h-4 w-4', iconCls)} />
      </div>
      <div className="text-2xl font-bold text-foreground tabular-nums leading-tight">
        {loading || value == null ? <Skeleton /> : value}
      </div>
      <p className="text-xs text-muted-foreground mt-1 leading-tight">{label}</p>
      {trend && (
        <p className={cn('text-[10px] mt-1', trend.value >= 0 ? 'text-green-500' : 'text-rose-500')}>
          {trend.value >= 0 ? '+' : ''}{trend.value} {trend.label}
        </p>
      )}
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
