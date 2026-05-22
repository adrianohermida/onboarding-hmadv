'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWorkspaceStore } from '@/store/workspace';

const SEGMENT_LABELS: Record<string, string> = {
  dashboard:     'Painel',
  clientes:      'Clientes',
  novo:          'Novo',
  onboarding:    'Meu Caso',
  documentos:    'Documentos',
  contratos:     'Contratos',
  custas:        'Custas',
  dividas:       'Dívidas',
  planos:        'Plano',
  financeiro:    'Financeiro',
  agenda:        'Agenda',
  tarefas:       'Tarefas',
  mensagens:     'Mensagens',
  processos:     'Processos',
  publicacoes:   'Publicações',
  configuracoes: 'Configurações',
  ajuda:         'Ajuda',
};

function labelForSegment(segment: string, isAdmin: boolean): string {
  if (SEGMENT_LABELS[segment]) return SEGMENT_LABELS[segment];
  // UUID or dynamic segment — show truncated
  if (segment.length > 20) return '…';
  return segment;
}

function isUuid(s: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

interface Crumb {
  label: string;
  href: string;
  current: boolean;
}

export default function Breadcrumbs({ className }: { className?: string }) {
  const pathname = usePathname();
  const { user } = useWorkspaceStore();
  const isAdmin = user?.isAdmin ?? false;

  const segments = pathname.split('/').filter(Boolean);

  // Build crumbs
  const crumbs: Crumb[] = segments.map((seg, idx) => {
    const href = '/' + segments.slice(0, idx + 1).join('/');
    const label = isUuid(seg) ? 'Detalhe' : labelForSegment(seg, isAdmin);
    return { label, href, current: idx === segments.length - 1 };
  });

  // Don't render if only one level deep (e.g., /dashboard)
  if (crumbs.length <= 1) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center gap-1 text-xs text-muted-foreground overflow-x-auto no-scrollbar', className)}
    >
      <Link
        href="/dashboard"
        className="flex items-center gap-1 hover:text-foreground transition-colors flex-shrink-0"
      >
        <Home className="h-3 w-3" />
      </Link>

      {crumbs.map((crumb) => (
        <div key={crumb.href} className="flex items-center gap-1 flex-shrink-0">
          <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
          {crumb.current ? (
            <span className="font-medium text-foreground truncate max-w-[140px]">{crumb.label}</span>
          ) : (
            <Link
              href={crumb.href}
              className="hover:text-foreground transition-colors truncate max-w-[140px]"
            >
              {crumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
