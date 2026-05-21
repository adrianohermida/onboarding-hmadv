'use client';

import { usePathname } from 'next/navigation';
import { Search } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspace';
import { getInitials } from '@/lib/utils';
import NotificationBell from '../notifications/NotificationBell';

const TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/clientes': 'Clientes',
  '/onboarding': 'Onboarding',
  '/documentos': 'Documentos',
  '/dividas': 'Dívidas',
  '/planos': 'Plano de Pagamento',
  '/financeiro': 'Financeiro',
  '/agenda': 'Agenda',
  '/tarefas': 'Tarefas',
  '/mensagens': 'Mensagens',
  '/processos': 'Processos',
  '/configuracoes': 'Configurações',
};

function getTitle(pathname: string): string {
  const exact = TITLES[pathname];
  if (exact) return exact;
  const prefix = Object.keys(TITLES).find((k) => k !== '/' && pathname.startsWith(k + '/'));
  return prefix ? TITLES[prefix] : 'Portal';
}

export default function Header() {
  const pathname = usePathname();
  const { user } = useWorkspaceStore();

  return (
    <header className="sticky top-0 z-30 h-14 border-b border-border bg-background/95 backdrop-blur flex items-center px-4 lg:px-6 gap-4">
      {/* Title — hidden on mobile (shown in mobile topbar) */}
      <h1 className="hidden lg:block text-base font-semibold text-foreground">{getTitle(pathname)}</h1>
      <div className="flex-1" />

      {/* Search trigger */}
      <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground bg-muted/50 rounded-lg px-3 py-1.5 transition-colors">
        <Search className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Buscar...</span>
        <kbd className="hidden sm:inline text-xs bg-background border border-border rounded px-1.5 py-0.5 font-mono">⌘K</kbd>
      </button>

      {/* Notifications */}
      <NotificationBell />

      {/* Avatar */}
      <button className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs text-primary-foreground font-bold flex-shrink-0">
        {getInitials(user?.nome ?? user?.email)}
      </button>
    </header>
  );
}
