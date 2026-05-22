'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Menu, X, LogOut, Settings, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWorkspaceStore } from '@/store/workspace';
import { createClient } from '@/lib/supabase/client';
import { getInitials } from '@/lib/utils';
import { ADMIN_SECTIONS, CLIENT_SECTIONS } from '../nav-config';

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useWorkspaceStore();

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
          <span className="text-sm font-semibold text-white truncate">Hermida Maia</span>
        </div>
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs text-primary-foreground font-bold flex-shrink-0">
          {getInitials(user?.nome ?? user?.email)}
        </div>
      </div>

      {/* Drawer overlay */}
      {open && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-sidebar flex flex-col safe-left safe-top safe-bottom">
            {/* Header */}
            <div className="flex items-center justify-between px-4 h-14 border-b border-sidebar-border flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">HM</span>
                </div>
                <span className="text-sm font-semibold text-white">Hermida Maia</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 text-white/70 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4 no-scrollbar">
              {sections.map((section) => (
                <div key={section.label || 'main'}>
                  {section.label && (
                    <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/30">
                      {section.label}
                    </p>
                  )}
                  <div className="space-y-px">
                    {section.items.map((item) => {
                      const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'));
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className={cn(
                            'flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors',
                            active
                              ? 'bg-sidebar-accent text-white'
                              : 'text-sidebar-foreground/70 hover:text-white hover:bg-sidebar-accent/50',
                          )}
                        >
                          <item.icon className="h-4 w-4 flex-shrink-0" />
                          <span className="flex-1">{item.label}</span>
                          {active && <ChevronRight className="h-3.5 w-3.5 opacity-60" />}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            {/* Footer */}
            <div className="border-t border-sidebar-border p-3 flex-shrink-0 space-y-px">
              <Link
                href="/configuracoes"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-sidebar-foreground/60 hover:text-white hover:bg-sidebar-accent/50 transition-colors"
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
                  <p className="text-xs text-sidebar-foreground/50 truncate">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={signOut}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-sidebar-foreground/60 hover:text-red-400 hover:bg-sidebar-accent/50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
