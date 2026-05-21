'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const schema = z.object({
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

export default function ConvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [step, setStep] = useState<'loading' | 'set-password' | 'done'>('loading');
  const [loading, setLoading] = useState(false);

  const form = useForm({ resolver: zodResolver(schema) });

  useEffect(() => {
    async function verifyToken() {
      const supabase = createClient();
      const { error } = await supabase.auth.verifyOtp({ token_hash: token, type: 'invite' });
      if (error) { toast.error('Convite inválido ou expirado'); router.push('/login'); return; }
      setStep('set-password');
    }
    verifyToken();
  }, [token, router]);

  async function handleSubmit({ password }: { password: string; confirmPassword: string }) {
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) { toast.error(error.message); return; }
      setStep('done');
      setTimeout(() => router.push('/onboarding'), 2000);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-md bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
        {step === 'loading' && (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400 mx-auto mb-3" />
            <p className="text-slate-400">Verificando convite...</p>
          </div>
        )}
        {step === 'set-password' && (
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-white mb-1">Defina sua senha</h2>
              <p className="text-slate-400 text-sm">Bem-vindo! Crie sua senha para ativar sua conta.</p>
            </div>
            {['password', 'confirmPassword'].map((field) => (
              <div key={field} className="space-y-1.5">
                <label className="text-sm text-slate-300 font-medium">
                  {field === 'password' ? 'Senha' : 'Confirmar senha'}
                </label>
                <input
                  {...form.register(field as 'password' | 'confirmPassword')}
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                {form.formState.errors[field as 'password'] && (
                  <p className="text-red-400 text-xs">{form.formState.errors[field as 'password']?.message}</p>
                )}
              </div>
            ))}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-xl py-3 transition-colors"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {loading ? 'Ativando...' : 'Ativar conta'}
            </button>
          </form>
        )}
        {step === 'done' && (
          <div className="text-center py-8">
            <CheckCircle2 className="h-12 w-12 text-green-400 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-white mb-1">Conta ativada!</h2>
            <p className="text-slate-400 text-sm">Redirecionando para o onboarding...</p>
          </div>
        )}
      </div>
    </div>
  );
}
