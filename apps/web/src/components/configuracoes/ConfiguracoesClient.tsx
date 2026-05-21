'use client';

import { useState, useTransition } from 'react';
import { useWorkspaceStore } from '@/store/workspace';
import { createClient } from '@/lib/supabase/client';
import { Moon, Sun, Monitor, LogOut, Shield, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface Props {
  userId: string;
  email: string;
  isAdmin: boolean;
  adminRole: string | null;
}

export default function ConfiguracoesClient({ userId, email, isAdmin, adminRole }: Props) {
  const router = useRouter();
  const { viewMode, setViewMode } = useWorkspaceStore();
  const [signingOut, startSignOut] = useTransition();
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');

  function applyTheme(t: 'light' | 'dark' | 'system') {
    setTheme(t);
    const root = document.documentElement;
    if (t === 'dark') root.classList.add('dark');
    else if (t === 'light') root.classList.remove('dark');
    else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      prefersDark ? root.classList.add('dark') : root.classList.remove('dark');
    }
    localStorage.setItem('theme', t);
  }

  function signOut() {
    startSignOut(async () => {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/login');
    });
  }

  return (
    <div className="space-y-4">
      {/* Account section */}
      <section className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <User className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Conta</h2>
        </div>
        <dl className="divide-y divide-border">
          <div className="flex justify-between px-4 py-3 text-sm">
            <dt className="text-muted-foreground">E-mail</dt>
            <dd className="font-medium">{email}</dd>
          </div>
          <div className="flex justify-between px-4 py-3 text-sm">
            <dt className="text-muted-foreground">Perfil</dt>
            <dd className="font-medium capitalize">
              {adminRole === 'platform_admin' ? 'Administrador da plataforma' : isAdmin ? 'Administrador' : 'Cliente'}
            </dd>
          </div>
          {isAdmin && (
            <div className="flex items-center justify-between px-4 py-3 text-sm">
              <dt className="text-muted-foreground">Modo de visualização</dt>
              <dd>
                <select
                  value={viewMode}
                  onChange={(e) => setViewMode(e.target.value as any)}
                  className="text-sm bg-background border border-border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="admin">Admin</option>
                  <option value="advogado">Advogado</option>
                  <option value="cliente">Cliente</option>
                </select>
              </dd>
            </div>
          )}
        </dl>
      </section>

      {/* Appearance */}
      <section className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <Monitor className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Aparência</h2>
        </div>
        <div className="flex gap-2 p-4">
          {([
            { value: 'light', label: 'Claro', icon: Sun },
            { value: 'dark', label: 'Escuro', icon: Moon },
            { value: 'system', label: 'Sistema', icon: Monitor },
          ] as const).map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => applyTheme(value)}
              className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-lg border transition-colors text-xs font-medium ${
                theme === value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* Security */}
      <section className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Segurança</h2>
        </div>
        <div className="px-4 py-3">
          <p className="text-xs text-muted-foreground">
            Acesso via link mágico (magic link). Nenhuma senha armazenada.
          </p>
        </div>
      </section>

      {/* Sign out */}
      <button
        onClick={signOut}
        disabled={signingOut}
        className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 bg-red-50 hover:bg-red-100 rounded-xl transition-colors disabled:opacity-50"
      >
        <LogOut className="h-4 w-4" />
        {signingOut ? 'Saindo...' : 'Sair da conta'}
      </button>
    </div>
  );
}
