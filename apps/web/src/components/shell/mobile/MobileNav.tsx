'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu, X, LayoutDashboard, Users, FileText, CreditCard, TrendingDown,
  Scale, LogOut, DollarSign, Calendar, CheckSquare, MessageSquare,
  Gavel, Newspaper, Settings, Briefcase,
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

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useWorkspaceStore();
  const counts = useSidebarCounts(user?.isAdmin ?? false);

  const sections = user?.isAdmin ? ADMIN_SECTIONS : CLIENT_SECTIONS;

  async function signOut() {
    await createClient().auth.signOut();
    router.push('/login');
  }

  return (
    <>
      {/* Top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 h-14 bg-sidebar border-b border-sidebar-border flex items-center px-4 gap-3 safe-top">
        <button
          onClick={() => setOpen(true)}
          className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-sidebar-accent transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">HM</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white leading-tight truncate">Hermida Maia</p>
          </div>
        </div>
        {/* Notification dot for mobile */}
        {(counts.publicacoes > 0 || counts.tarefas > 0 || counts.mensagens > 0) && (
          <span className="w-2.5 h-2.5 rounded-full bg-primary flex-shrink-0" />
        )}
      </div>

      {/* Drawer backdrop */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div className={cn(
        'lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-sidebar flex flex-col safe-left safe-top safe-bottom',
        'transition-transform duration-200 ease-out',
        open ? 'translate-x-0' : '-translate-x-full',
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-sidebar-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">HM</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-white leading-tight">Hermida Maia</p>
              <p className="text-[10px] text-sidebar-foreground/50">Advocacia</p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-sidebar-accent transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 no-scrollbar space-y-4">
          {sections.map((section) => (
            <div key={section.label}>
              <p className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'));
                  const count = item.countKey ? (counts[item.countKey] ?? 0) : 0;
                  return (
                    <Link
                      key={item.href + item.label}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors',
                        active
                          ? 'bg-sidebar-accent text-white'
                          : 'text-sidebar-foreground/70 hover:text-white hover:bg-sidebar-accent/60',
                      )}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      <span className="flex-1">{item.label}</span>
                      {count > 0 && (
                        <span className="flex-shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                          {count > 99 ? '99+' : count}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-3 flex-shrink-0 space-y-1">
          <Link
            href="/configuracoes"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-sidebar-foreground/60 hover:text-white hover:bg-sidebar-accent transition-colors"
          >
            <Settings className="h-4 w-4" />
            Configurações
          </Link>

          <div className="flex items-center gap-3 px-3 py-2 mt-1">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs text-white font-bold flex-shrink-0">
              {getInitials(user?.nome ?? user?.email)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{user?.nome ?? 'Usuário'}</p>
              <p className="text-[10px] text-sidebar-foreground/50 truncate">
                {user?.isAdmin ? 'Advogado' : 'Cliente'}
              </p>
            </div>
            <button
              onClick={signOut}
              className="p-1.5 rounded-lg text-sidebar-foreground/50 hover:text-red-400 hover:bg-sidebar-accent transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
