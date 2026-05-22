'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

function jud() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (createClient() as any).schema('judiciario');
}

export interface SidebarCounts {
  publicacoes: number;
  tarefas: number;
  mensagens: number;
  documentos: number;
}

export function useSidebarCounts(isAdmin: boolean): SidebarCounts {
  const supabase = createClient();

  const { data: publicacoes = 0 } = useQuery<number>({
    queryKey: ['sidebar-count-publicacoes'],
    enabled: isAdmin,
    queryFn: async () => {
      try {
        const { count } = await jud()
          .from('publicacoes')
          .select('id', { count: 'exact', head: true })
          .eq('lido', false)
          .eq('ativo', true);
        return count ?? 0;
      } catch {
        return 0;
      }
    },
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  const { data: tarefas = 0 } = useQuery<number>({
    queryKey: ['sidebar-count-tarefas'],
    enabled: isAdmin,
    queryFn: async () => {
      try {
        const { count } = await supabase
          .from('re_tarefas')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pendente');
        return count ?? 0;
      } catch {
        return 0;
      }
    },
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  const { data: mensagens = 0 } = useQuery<number>({
    queryKey: ['sidebar-count-mensagens', isAdmin],
    queryFn: async () => {
      try {
        const { count } = await supabase
          .from('re_mensagens')
          .select('id', { count: 'exact', head: true })
          .eq('lida', false);
        return count ?? 0;
      } catch {
        return 0;
      }
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const { data: documentos = 0 } = useQuery<number>({
    queryKey: ['sidebar-count-documentos', isAdmin],
    queryFn: async () => {
      try {
        const q = supabase
          .from('portal_documentos')
          .select('id', { count: 'exact', head: true });
        const filtered = isAdmin
          ? q.in('workflow_status', ['pendente_envio', 'em_analise', 'pendente_correcao'])
          : q.in('workflow_status', ['pendente_envio', 'pendente_correcao']);
        const { count } = await filtered;
        return count ?? 0;
      } catch {
        return 0;
      }
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  return { publicacoes, tarefas, mensagens, documentos };
}
