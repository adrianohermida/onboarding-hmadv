'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, Mail, ArrowRight, KeyRound } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

const emailSchema = z.object({ email: z.string().email('E-mail inválido') });
const otpSchema = z.object({ token: z.string().min(6, 'Token inválido').max(6) });

type Step = 'email' | 'otp';

export default function LoginForm() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const emailForm = useForm({ resolver: zodResolver(emailSchema) });
  const otpForm = useForm({ resolver: zodResolver(otpSchema) });

  async function handleEmailSubmit({ email: e }: { email: string }) {
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: e,
        options: { shouldCreateUser: false },
      });
      if (error) { toast.error(error.message); return; }
      setEmail(e);
      setStep('otp');
      toast.success('Código enviado para ' + e);
    } finally {
      setLoading(false);
    }
  }

  async function handleOtpSubmit({ token }: { token: string }) {
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
      if (error) { toast.error('Código inválido ou expirado'); return; }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
      {step === 'email' ? (
        <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-white mb-1">Acesse sua conta</h2>
            <p className="text-slate-400 text-sm">Informe seu e-mail para receber o código de acesso.</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-300 font-medium">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
              <input
                {...emailForm.register('email')}
                type="email"
                autoComplete="email"
                autoFocus
                placeholder="seu@email.com"
                className={cn(
                  'w-full bg-white/5 border border-white/15 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-slate-500',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                  'transition-all text-sm',
                )}
              />
            </div>
            {emailForm.formState.errors.email && (
              <p className="text-red-400 text-xs">{emailForm.formState.errors.email.message}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-xl py-3 transition-colors"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            {loading ? 'Enviando...' : 'Continuar'}
          </button>
        </form>
      ) : (
        <form onSubmit={otpForm.handleSubmit(handleOtpSubmit)} className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-white mb-1">Digite o código</h2>
            <p className="text-slate-400 text-sm">
              Enviamos um código de 6 dígitos para <strong className="text-slate-300">{email}</strong>.
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-300 font-medium">Código de acesso</label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
              <input
                {...otpForm.register('token')}
                type="text"
                inputMode="numeric"
                maxLength={6}
                autoFocus
                placeholder="000000"
                className={cn(
                  'w-full bg-white/5 border border-white/15 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-slate-500',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                  'transition-all text-sm tracking-widest text-center',
                )}
              />
            </div>
            {otpForm.formState.errors.token && (
              <p className="text-red-400 text-xs">{otpForm.formState.errors.token.message}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-xl py-3 transition-colors"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            {loading ? 'Verificando...' : 'Entrar'}
          </button>
          <button
            type="button"
            onClick={() => setStep('email')}
            className="w-full text-slate-400 hover:text-slate-300 text-sm py-2 transition-colors"
          >
            ← Voltar
          </button>
        </form>
      )}
    </div>
  );
}
