'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, FileText, CreditCard, TrendingDown,
  Settings, LogOut, ChevronLeft, ChevronRight, Scale, Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWorkspaceStore } from '@/store/workspace';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { getInitials } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clientes', label: 'Clientes', icon: Users, adminOnly: true },
  { href: '/onboarding', label: 'Onboarding', icon: Scale },
  { href: '/documentos', label: 'Documentos', icon: FileText },
  { href: '/dividas', label: 'Dívidas', icon: TrendingDown },
  { href: '/planos', label: 'Plano de Pagamento', icon: CreditCard },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, sidebarCollapsed, setSidebarCollapsed } = useWorkspaceStore();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  const visibleItems = NAV_ITEMS.filter((item) => !item.adminOnly || user?.isAdmin);

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border',
        'transition-all duration-200 ease-in-out',
        sidebarCollapsed ? 'w-16' : 'w-60',
        'hidden lg:flex',
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center h-16 border-b border-sidebar-border px-4', sidebarCollapsed && 'justify-center')}>
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
          <span className="text-white text-xs font-bold">HM</span>
        </div>
        {!sidebarCollapsed && (
          <span className="ml-3 text-sm font-semibold text-white truncate">Hermida Maia</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-0.5 px-2 no-scrollbar">
        {visibleItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              title={sidebarCollapsed ? item.label : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-sidebar-accent text-white'
                  : 'text-sidebar-foreground/70 hover:text-white hover:bg-sidebar-accent',
                sidebarCollapsed && 'justify-center px-2',
              )}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-2 space-y-0.5">
        <Link
          href="/configuracoes"
          title={sidebarCollapsed ? 'Configurações' : undefined}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground/60 hover:text-white hover:bg-sidebar-accent transition-colors',
            sidebarCollapsed && 'justify-center px-2',
          )}
        >
          <Settings className="h-4 w-4 flex-shrink-0" />
          {!sidebarCollapsed && <span>Configurações</span>}
        </Link>
        <button
          onClick={handleSignOut}
          title={sidebarCollapsed ? 'Sair' : undefined}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground/60 hover:text-red-400 hover:bg-sidebar-accent transition-colors',
            sidebarCollapsed && 'justify-center px-2',
          )}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!sidebarCollapsed && <span>Sair</span>}
        </button>

        {/* User + collapse toggle */}
        <div className={cn('flex items-center mt-2 pt-2 border-t border-sidebar-border', sidebarCollapsed ? 'justify-center' : 'gap-2 px-1')}>
          {!sidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{user?.nome ?? user?.email}</p>
              <p className="text-xs text-sidebar-foreground/50 truncate">{user?.email}</p>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="flex-shrink-0 p-1.5 rounded-lg text-sidebar-foreground/50 hover:text-white hover:bg-sidebar-accent transition-colors"
          >
            {sidebarCollapsed
              ? <ChevronRight className="h-4 w-4" />
              : <ChevronLeft className="h-4 w-4" />
            }
          </button>
        </div>
      </div>
    </aside>
  );
}
