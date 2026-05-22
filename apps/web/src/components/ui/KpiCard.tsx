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
  return <div className="h-6 w-10 rounded bg-muted animate-pulse" />;
}

export default function KpiCard({
  label, value, icon: Icon, iconCls = 'text-primary', bgCls = 'bg-primary/10',
  href, loading, trend, className,
}: KpiCardProps) {
  const content = (
    <div className={cn(
      'bg-card border border-border rounded-lg p-3 transition-colors',
      href && 'hover:border-primary/40 hover:bg-muted/30 cursor-pointer',
      className,
    )}>
      <div className={cn('inline-flex p-1.5 rounded-md mb-2', bgCls)}>
        <Icon className={cn('h-4 w-4', iconCls)} />
      </div>
      <div className="text-xl font-bold text-foreground tabular-nums leading-none">
        {loading || value == null ? <Skeleton /> : value}
      </div>
      <p className="text-[11px] text-muted-foreground mt-1 leading-tight">{label}</p>
      {trend && (
        <p className={cn('text-[10px] mt-1', trend.value >= 0 ? 'text-green-500' : 'text-rose-500')}>
          {trend.value >= 0 ? '+' : ''}{trend.value} {trend.label}
        </p>
      )}
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
