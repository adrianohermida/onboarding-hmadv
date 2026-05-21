import type { Metadata } from 'next';
import LoginForm from './login-form';

export const metadata: Metadata = { title: 'Entrar' };

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 mb-4">
            <span className="text-white text-xl font-bold">HM</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Hermida Maia Advocacia</h1>
          <p className="text-slate-400 text-sm mt-1">Portal Jurídico — Superendividamento</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
