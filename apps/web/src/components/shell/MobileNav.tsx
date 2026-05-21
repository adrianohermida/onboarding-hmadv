'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, LayoutDashboard, Users, FileText, CreditCard, TrendingDown, Scale, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWorkspaceStore } from '@/store/workspace';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { getInitials } from '@/lib/utils';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clientes', label: 'Clientes', icon: Users, adminOnly: true },
  { href: '/onboarding', label: 'Onboarding', icon: Scale },
  { href: '/documentos', label: 'Documentos', icon: FileText },
  { href: '/dividas', label: 'Dívidas', icon: TrendingDown },
  { href: '/planos', label: 'Plano', icon: CreditCard },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useWorkspaceStore();

  async function signOut() {
    await createClient().auth.signOut();
    router.push('/login');
  }

  const items = NAV.filter((i) => !i.adminOnly || user?.isAdmin);

  return (
    <>
      {/* Top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 h-14 bg-sidebar border-b border-sidebar-border flex items-center px-4 gap-3 safe-top">
        <button onClick={() => setOpen(true)} className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-sidebar-accent">
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">HM</span>
          </div>
          <span className="text-sm font-semibold text-white truncate">Hermida Maia</span>
        </div>
      </div>

      {/* Drawer */}
      {open && (
        <>
          <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-sidebar flex flex-col animate-slide-in-left safe-left safe-top safe-bottom">
            <div className="flex items-center justify-between px-4 h-14 border-b border-sidebar-border">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">HM</span>
                </div>
                <span className="text-sm font-semibold text-white">Hermida Maia</span>
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 text-white/70 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 no-scrollbar">
              {items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors',
                      active ? 'bg-sidebar-accent text-white' : 'text-sidebar-foreground/70 hover:text-white hover:bg-sidebar-accent',
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-sidebar-border p-3">
              <div className="flex items-center gap-3 px-3 py-2 mb-1">
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
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-sidebar-foreground/60 hover:text-red-400 hover:bg-sidebar-accent transition-colors"
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
