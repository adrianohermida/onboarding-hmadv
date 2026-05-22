'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, Settings, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWorkspaceStore } from '@/store/workspace';
import { createClient } from '@/lib/supabase/client';
import { getInitials } from '@/lib/utils';
import { useSidebarCounts } from '@/lib/hooks/use-sidebar-counts';
import { ADMIN_SECTIONS, CLIENT_SECTIONS } from '../nav-config';

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useWorkspaceStore();
  const counts = useSidebarCounts(user?.isAdmin ?? false);
  const sections = user?.isAdmin ? ADMIN_SECTIONS : CLIENT_SECTIONS;

  const hasAlert =
    counts.publicacoes > 0 || counts.tarefas > 0 || counts.mensagens > 0;

  async function signOut() {
    await createClient().auth.signOut();
    router.push('/login');
  }

  return (
    <>
      {/* Barra superior mobile */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 h-14 bg-sidebar border-b border-sidebar-border flex items-center px-4 gap-3">
        <button
          onClick={() => setOpen(true)}
          className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-sidebar-accent/60 transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-[10px] font-bold">HM</span>
          </div>
          <p className="text-sm font-semibold text-white truncate">Hermida Maia</p>
        </div>

        {hasAlert && (
          <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
        )}
      </div>

      {/* Backdrop */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          'lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-sidebar flex flex-col',
          'transition-transform duration-200 ease-out',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-sidebar-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">HM</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-white leading-tight">Hermida Maia</p>
              <p className="text-[10px] text-sidebar-foreground/40">Advocacia</p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 text-white/60 hover:text-white rounded-lg hover:bg-sidebar-accent/60 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navegação */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 no-scrollbar space-y-4">
          {sections.map((section) => (
            <div key={section.label}>
              <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/30">
                {section.label}
              </p>
              <div className="space-y-px">
                {section.items.map((item) => {
                  const active =
                    pathname === item.href ||
                    (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'));
                  const count = item.countKey ? (counts[item.countKey] ?? 0) : 0;

                  return (
                    <Link
                      key={item.href + item.label}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                        active
                          ? 'bg-sidebar-accent text-white'
                          : 'text-sidebar-foreground/60 hover:text-white hover:bg-sidebar-accent/50',
                      )}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      <span className="flex-1">{item.label}</span>
                      {count > 0 && (
                        <span className="flex-shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center tabular-nums">
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

        {/* Rodapé */}
        <div className="border-t border-sidebar-border p-2 flex-shrink-0 space-y-px">
          <Link
            href="/configuracoes"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground/50 hover:text-white hover:bg-sidebar-accent/50 transition-colors"
          >
            <Settings className="h-4 w-4" />
            Configurações
          </Link>

          <div className="flex items-center gap-3 px-3 py-2 mt-1">
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-[11px] text-white font-bold flex-shrink-0">
              {getInitials(user?.nome ?? user?.email)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{user?.nome ?? 'Usuário'}</p>
              <p className="text-[10px] text-sidebar-foreground/40 truncate">
                {user?.isAdmin ? 'Advogado' : 'Cliente'}
              </p>
            </div>
            <button
              onClick={signOut}
              className="p-1.5 rounded-lg text-sidebar-foreground/40 hover:text-red-400 hover:bg-sidebar-accent/50 transition-colors"
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
