'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  nome: z.string().min(2, 'Nome muito curto'),
  cpf: z.string().optional(),
  telefone: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function ClienteForm() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    const supabase = createClient();

    // Create auth user via admin invite (calls edge function)
    const { data: result, error } = await supabase.functions.invoke('invite-user', {
      body: { email: data.email, nome: data.nome, cpf: data.cpf, telefone: data.telefone },
    });

    if (error) {
      toast.error('Erro ao criar cliente: ' + error.message);
      return;
    }

    toast.success('Cliente criado. Convite enviado por e-mail.');
    router.push('/clientes');
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-card border border-border rounded-xl p-5 space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2 space-y-1">
          <label className="text-sm font-medium">Nome completo *</label>
          <input
            {...register('nome')}
            placeholder="João da Silva"
            className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
          {errors.nome && <p className="text-xs text-red-500">{errors.nome.message}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">E-mail *</label>
          <input
            {...register('email')}
            type="email"
            placeholder="joao@email.com"
            className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
          {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">CPF</label>
          <input
            {...register('cpf')}
            placeholder="000.000.000-00"
            className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Telefone</label>
          <input
            {...register('telefone')}
            placeholder="(11) 99999-9999"
            className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-5 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Criando...' : 'Criar cliente'}
        </button>
      </div>
    </form>
  );
}
