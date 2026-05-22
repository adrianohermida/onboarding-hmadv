'use client';

import { usePathname } from 'next/navigation';
import { Search } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspace';
import { getInitials } from '@/lib/utils';
import NotificationBell from '../notifications/NotificationBell';
import Breadcrumbs from '../breadcrumbs/Breadcrumbs';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':     'Painel',
  '/clientes':      'Clientes',
  '/onboarding':    'Meu Caso',
  '/documentos':    'Documentos',
  '/contratos':     'Contratos',
  '/custas':        'Custas',
  '/dividas':       'Dívidas',
  '/planos':        'Plano de Pagamento',
  '/financeiro':    'Financeiro',
  '/agenda':        'Agenda',
  '/tarefas':       'Tarefas',
  '/mensagens':     'Mensagens',
  '/processos':     'Processos',
  '/publicacoes':   'Publicações',
  '/configuracoes': 'Configurações',
  '/ajuda':         'Ajuda',
};

function getTitle(pathname: string): string {
  const exact = PAGE_TITLES[pathname];
  if (exact) return exact;
  const prefix = Object.keys(PAGE_TITLES).find(
    (k) => k !== '/' && pathname.startsWith(k + '/'),
  );
  return prefix ? PAGE_TITLES[prefix] : 'Portal';
}

export default function Header() {
  const pathname = usePathname();
  const { user } = useWorkspaceStore();
  const title = getTitle(pathname);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur flex-shrink-0">
      <div className="flex items-center h-14 px-4 lg:px-6 gap-3">
        {/* Title + breadcrumbs */}
        <div className="flex-1 min-w-0 hidden lg:block">
          <Breadcrumbs />
          <h1 className="text-base font-semibold text-foreground leading-tight mt-0.5">{title}</h1>
        </div>

        <div className="flex-1 lg:hidden" />

        {/* Search trigger */}
        <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted rounded-lg px-3 py-1.5 transition-colors">
          <Search className="h-3.5 w-3.5" />
          <span className="hidden sm:inline text-xs">Buscar...</span>
          <kbd className="hidden sm:inline text-[10px] bg-background border border-border rounded px-1.5 py-0.5 font-mono">
            ⌘K
          </kbd>
        </button>

        {/* Notifications */}
        <NotificationBell />

        {/* Avatar */}
        <div className="relative">
          <button className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs text-primary-foreground font-bold flex-shrink-0 hover:opacity-90 transition-opacity">
            {getInitials(user?.nome ?? user?.email)}
          </button>
          {user?.isAdmin && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-background" />
          )}
        </div>
      </div>
    </header>
  );
}
