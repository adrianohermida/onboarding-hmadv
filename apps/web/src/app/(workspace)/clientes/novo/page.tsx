import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ClienteForm from '@/components/clientes/ClienteForm';

export const metadata: Metadata = { title: 'Novo Cliente' };

export default async function NovoClientePage() {
  const supabase = await createClient();
  const { data: adminData } = await supabase.from('admin_users').select('role').maybeSingle();
  if (!adminData) redirect('/dashboard');

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/clientes" className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-lg font-semibold">Novo cliente</h1>
          <p className="text-xs text-muted-foreground">Cadastro manual de cliente</p>
        </div>
      </div>
      <ClienteForm />
    </div>
  );
}
