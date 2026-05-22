'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, FileText, CreditCard, TrendingDown,
  Settings, LogOut, ChevronLeft, ChevronRight, Scale,
  DollarSign, Calendar, CheckSquare, MessageSquare, Gavel, Newspaper,
  Briefcase,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWorkspaceStore } from '@/store/workspace';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { getInitials } from '@/lib/utils';
import { useSidebarCounts } from '@/lib/hooks/use-sidebar-counts';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  countKey?: keyof ReturnType<typeof useSidebarCounts>;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const ADMIN_SECTIONS: NavSection[] = [
  {
    label: 'Meu Escritório',
    items: [
      { href: '/dashboard', label: 'Painel', icon: LayoutDashboard },
      { href: '/clientes', label: 'Clientes', icon: Users },
      { href: '/processos', label: 'Processos', icon: Gavel },
      { href: '/publicacoes', label: 'Publicações', icon: Newspaper, countKey: 'publicacoes' },
      { href: '/tarefas', label: 'Tarefas', icon: CheckSquare, countKey: 'tarefas' },
    ],
  },
  {
    label: 'Operacional',
    items: [
      { href: '/agenda', label: 'Agenda', icon: Calendar },
      { href: '/documentos', label: 'Documentos', icon: FileText, countKey: 'documentos' },
      { href: '/mensagens', label: 'Mensagens', icon: MessageSquare, countKey: 'mensagens' },
    ],
  },
  {
    label: 'Financeiro',
    items: [
      { href: '/financeiro', label: 'Financeiro', icon: DollarSign },
    ],
  },
];

const CLIENT_SECTIONS: NavSection[] = [
  {
    label: 'Meu Processo',
    items: [
      { href: '/dashboard', label: 'Meu Painel', icon: LayoutDashboard },
      { href: '/onboarding', label: 'Meu Caso', icon: Scale },
      { href: '/documentos', label: 'Documentos', icon: FileText, countKey: 'documentos' },
    ],
  },
  {
    label: 'Planejamento',
    items: [
      { href: '/planos', label: 'Meu Plano', icon: Briefcase },
      { href: '/dividas', label: 'Minhas Dívidas', icon: TrendingDown },
      { href: '/planos', label: 'Plano de Pagamento', icon: CreditCard },
    ],
  },
  {
    label: 'Comunicação',
    items: [
      { href: '/agenda', label: 'Agenda', icon: Calendar },
      { href: '/mensagens', label: 'Mensagens', icon: MessageSquare, countKey: 'mensagens' },
    ],
  },
];

function Badge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <span className="ml-auto flex-shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center tabular-nums">
      {count > 99 ? '99+' : count}
    </span>
  );
}

interface NavLinkProps {
  item: NavItem;
  counts: ReturnType<typeof useSidebarCounts>;
  collapsed: boolean;
}

function NavLink({ item, counts, collapsed }: NavLinkProps) {
  const pathname = usePathname();
  const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'));
  const count = item.countKey ? (counts[item.countKey] ?? 0) : 0;

  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 relative',
        active
          ? 'bg-sidebar-accent text-white shadow-sm'
          : 'text-sidebar-foreground/70 hover:text-white hover:bg-sidebar-accent/60',
        collapsed && 'justify-center px-2',
      )}
    >
      <item.icon className="h-4 w-4 flex-shrink-0" />
      {!collapsed && (
        <>
          <span className="truncate flex-1">{item.label}</span>
          <Badge count={count} />
        </>
      )}
      {/* Collapsed badge */}
      {collapsed && count > 0 && (
        <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary" />
      )}
    </Link>
  );
}

export default function Sidebar() {
  const router = useRouter();
  const { user, sidebarCollapsed, setSidebarCollapsed } = useWorkspaceStore();
  const counts = useSidebarCounts(user?.isAdmin ?? false);

  const sections = user?.isAdmin ? ADMIN_SECTIONS : CLIENT_SECTIONS;

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

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
      <div className={cn(
        'flex items-center h-16 border-b border-sidebar-border px-4 flex-shrink-0',
        sidebarCollapsed && 'justify-center px-2',
      )}>
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
          <span className="text-white text-xs font-bold">HM</span>
        </div>
        {!sidebarCollapsed && (
          <div className="ml-3 min-w-0">
            <p className="text-sm font-semibold text-white truncate leading-tight">Hermida Maia</p>
            <p className="text-[10px] text-sidebar-foreground/50 truncate">Advocacia</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 no-scrollbar space-y-4">
        {sections.map((section) => (
          <div key={section.label}>
            {!sidebarCollapsed && (
              <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink key={item.href + item.label} item={item} counts={counts} collapsed={sidebarCollapsed} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-2 space-y-0.5 flex-shrink-0">
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

        {/* User + toggle */}
        <div className={cn(
          'flex items-center mt-2 pt-2 border-t border-sidebar-border',
          sidebarCollapsed ? 'justify-center' : 'gap-2 px-1',
        )}>
          {!sidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate leading-tight">{user?.nome ?? user?.email}</p>
              <p className="text-[10px] text-sidebar-foreground/50 truncate">
                {user?.isAdmin ? 'Advogado' : 'Cliente'}
              </p>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="flex-shrink-0 p-1.5 rounded-lg text-sidebar-foreground/50 hover:text-white hover:bg-sidebar-accent transition-colors"
          >
            {sidebarCollapsed
              ? <ChevronRight className="h-4 w-4" />
              : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </aside>
  );
}
