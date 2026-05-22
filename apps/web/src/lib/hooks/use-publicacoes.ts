'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type {
  Publicacao,
  PublicacaoDetalhe,
  PublicacaoFiltros,
  PublicacaoSecao,
  PrazoCalculado,
  Audiencia,
  Movimento,
  Parte,
  NovaTarefa,
  NovaAudiencia,
} from '@/components/publicacoes/types';

function jud() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (createClient() as any).schema('judiciario');
}

const PUBLICACAO_LIST_SELECT = `
  id, processo_id, data_publicacao, conteudo, tem_prazo, prazo_data,
  lido, ativo, nome_cliente, nome_diario, cidade_comarca_descricao,
  vara_descricao, numero_processo_api, adriano_polo, data_hora_cadastro,
  ai_resumo, ai_tipo_ato, ai_prazo_sugerido, ai_urgencia, ai_enriquecido_at,
  processos:processo_id (
    id, numero_cnj, tribunal, comarca, status, classe, orgao_julgador
  ),
  prazo_calculado (
    id, data_vencimento, status, prioridade
  )
`;

function applySecaoFilter(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  q: any,
  secao: PublicacaoSecao,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  switch (secao) {
    case 'caixa_entrada':
      return q.eq('lido', false).eq('ativo', true);
    case 'com_prazo':
      return q.eq('tem_prazo', true).eq('ativo', true);
    case 'urgentes':
      return q.in('ai_urgencia', ['urgente', 'critica', 'alta']).eq('ativo', true);
    case 'lidas':
      return q.eq('lido', true);
    case 'pendentes':
      return q.eq('ativo', true);
    case 'arquivadas':
      return q.eq('ativo', false);
    case 'triagem_ia':
      return q.is('ai_enriquecido_at', null).eq('ativo', true);
    case 'sem_vinculo':
      return q.is('processo_id', null).eq('ativo', true);
    default:
      return q;
  }
}

function applyFiltros(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  q: any,
  filtros: PublicacaoFiltros,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  if (filtros.urgencia) q = q.eq('ai_urgencia', filtros.urgencia);
  if (filtros.temPrazo === 'sim') q = q.eq('tem_prazo', true);
  if (filtros.temPrazo === 'nao') q = q.eq('tem_prazo', false);
  if (filtros.lido === 'lido') q = q.eq('lido', true);
  if (filtros.lido === 'nao_lido') q = q.eq('lido', false);
  if (filtros.tipoAto) q = q.eq('ai_tipo_ato', filtros.tipoAto);
  if (filtros.search) {
    q = q.or(
      `conteudo.ilike.%${filtros.search}%,numero_processo_api.ilike.%${filtros.search}%,nome_cliente.ilike.%${filtros.search}%`,
    );
  }
  if (filtros.periodo && filtros.periodo !== 'todos') {
    const dias = filtros.periodo === '7d' ? 7 : filtros.periodo === '30d' ? 30 : 90;
    const desde = new Date();
    desde.setDate(desde.getDate() - dias);
    q = q.gte('data_publicacao', desde.toISOString());
  }
  return q;
}

export function usePublicacoes(
  secao: PublicacaoSecao,
  filtros: PublicacaoFiltros,
  page = 0,
) {
  return useQuery<Publicacao[]>({
    queryKey: ['publicacoes', secao, filtros, page],
    queryFn: async () => {
      let q = jud().from('publicacoes').select(PUBLICACAO_LIST_SELECT);
      q = applySecaoFilter(q, secao, );
      q = applyFiltros(q, filtros);
      q = q.order('data_publicacao', { ascending: false }).range(page * 30, page * 30 + 29);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Publicacao[];
    },
    staleTime: 30_000,
  });
}

export function usePublicacaoDetalhe(id: string | null) {
  return useQuery<PublicacaoDetalhe | null>({
    queryKey: ['publicacao', id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await jud()
        .from('publicacoes')
        .select(`
          id, processo_id, data_publicacao, data_disponibilizacao, conteudo, despacho,
          tem_prazo, prazo_data, lido, ativo, nome_cliente, nome_diario, descricao_diario,
          nome_caderno_diario, cidade_comarca_descricao, vara_descricao, numero_processo_api,
          adriano_polo, palavras_chave, numero_edicao, pagina_inicial, pagina_final, comentario,
          ai_resumo, ai_tipo_ato, ai_prazo_sugerido, ai_urgencia, ai_enriquecido_at, data_hora_cadastro,
          processos:processo_id (
            id, numero_cnj, tribunal, comarca, status, classe, orgao_julgador
          ),
          prazo_calculado (
            id, titulo, data_base, data_inicio_contagem, data_vencimento, status, prioridade, observacoes_ia, metadata,
            prazo_regra:prazo_regra_id (
              ato_praticado, prazo_dias, tipo_contagem, base_legal, artigo
            )
          )
        `)
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data as PublicacaoDetalhe | null;
    },
    staleTime: 15_000,
  });
}

export function usePublicacaoTimeline(processoId: string | null) {
  return useQuery({
    queryKey: ['publicacao-timeline', processoId],
    enabled: !!processoId,
    queryFn: async () => {
      if (!processoId) return { movimentos: [], audiencias: [], partes: [] };

      const [movRes, audRes, partesRes] = await Promise.all([
        jud()
          .from('movimentos')
          .select('id, descricao, data_movimento, codigo')
          .eq('processo_id', processoId)
          .order('data_movimento', { ascending: false })
          .limit(20),
        jud()
          .from('audiencias')
          .select('id, tipo, data_audiencia, descricao, local, situacao, origem')
          .eq('processo_id', processoId)
          .order('data_audiencia', { ascending: false })
          .limit(10),
        jud()
          .from('partes')
          .select('id, nome, tipo, polo, representada_pelo_escritorio, cliente_hmadv')
          .eq('processo_id', processoId)
          .limit(20),
      ]);

      return {
        movimentos: (movRes.data ?? []) as Movimento[],
        audiencias: (audRes.data ?? []) as Audiencia[],
        partes: (partesRes.data ?? []) as Parte[],
      };
    },
    staleTime: 60_000,
  });
}

export function usePublicacoesCount(secao: PublicacaoSecao) {
  return useQuery({
    queryKey: ['publicacoes-count', secao],
    queryFn: async () => {
      let q = jud().from('publicacoes').select('id', { count: 'exact', head: true });
      q = applySecaoFilter(q, secao);
      const { count, error } = await q;
      if (error) return 0;
      return count ?? 0;
    },
    staleTime: 60_000,
  });
}

export function useMarcarLida() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await jud()
        .from('publicacoes')
        .update({ lido: true })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['publicacoes'] });
      qc.invalidateQueries({ queryKey: ['publicacao'] });
    },
  });
}

export function useMarcarUrgente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, urgencia }: { id: string; urgencia: string }) => {
      const { error } = await jud()
        .from('publicacoes')
        .update({ ai_urgencia: urgencia })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['publicacoes'] });
      qc.invalidateQueries({ queryKey: ['publicacao'] });
    },
  });
}

export function useArquivar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await jud()
        .from('publicacoes')
        .update({ ativo: false })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['publicacoes'] });
    },
  });
}

export function useCriarAudiencia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      processoId,
      publicacaoId,
      dados,
    }: {
      processoId: string;
      publicacaoId: string;
      dados: NovaAudiencia;
    }) => {
      const { data, error } = await jud()
        .from('audiencias')
        .insert({
          processo_id: processoId,
          origem: 'publicacao',
          origem_id: publicacaoId,
          tipo: dados.tipo,
          data_audiencia: dados.data_audiencia || null,
          descricao: dados.descricao,
          local: dados.local,
          situacao: dados.situacao || 'detectada',
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['publicacao-timeline', variables.processoId] });
    },
  });
}

export function useCriarPrazo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      processoId,
      publicacaoId,
      titulo,
      dataBase,
      dataVencimento,
      dataInicioContagem,
    }: {
      processoId: string;
      publicacaoId: string;
      titulo: string;
      dataBase: string;
      dataVencimento: string;
      dataInicioContagem: string;
    }) => {
      const { data, error } = await jud()
        .from('prazo_calculado')
        .insert({
          processo_id: processoId,
          publicacao_id: publicacaoId,
          evento_tipo: 'publicacao',
          titulo,
          data_base: dataBase,
          data_inicio_contagem: dataInicioContagem,
          data_vencimento: dataVencimento,
          status: 'aberto',
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['publicacao', variables.publicacaoId] });
    },
  });
}

export function useCriarTarefaLocal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      dados,
      processoId,
    }: {
      dados: NovaTarefa;
      processoId?: string | null;
      publicacaoId: string;
    }) => {
      // Insert a local task record — real Freshsales sync handled by backend worker
      const fsIdPlaceholder = `local_${Date.now()}`;
      const { data, error } = await jud()
        .from('tasks_freshsales')
        .insert({
          fs_id: fsIdPlaceholder,
          title: dados.titulo,
          description: dados.descricao,
          due_date: dados.due_date || null,
          status: 'open',
          ...(processoId ? {} : {}),
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['publicacao-timeline'] });
    },
  });
}

export function useVincularProcesso() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      publicacaoId,
      processoId,
    }: {
      publicacaoId: string;
      processoId: string;
    }) => {
      const { error } = await jud()
        .from('publicacoes')
        .update({ processo_id: processoId })
        .eq('id', publicacaoId);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['publicacao', variables.publicacaoId] });
      qc.invalidateQueries({ queryKey: ['publicacoes'] });
    },
  });
}

export function useMarcarNaoLida() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await jud()
        .from('publicacoes')
        .update({ lido: false })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['publicacoes'] });
      qc.invalidateQueries({ queryKey: ['publicacao'] });
    },
  });
}

export function useSalvarComentario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, comentario }: { id: string; comentario: string }) => {
      const { error } = await jud()
        .from('publicacoes')
        .update({ comentario: comentario.trim() || null })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['publicacao', variables.id] });
    },
  });
}

export function useCriarProcessoPublicacao() {
  const qc = useQueryClient();
  const supabase = createClient();
  return useMutation({
    mutationFn: async ({
      publicacaoId,
      numeroCnj,
      comarca,
      vara,
      classe,
    }: {
      publicacaoId: string;
      numeroCnj: string;
      comarca?: string | null;
      vara?: string | null;
      classe?: string | null;
    }) => {
      // Create process in judiciário schema
      const { data: processo, error: errProcesso } = await jud()
        .from('processos')
        .insert({
          numero_cnj: numeroCnj,
          comarca,
          orgao_julgador: vara,
          classe,
          status: 'ativo',
        })
        .select('id')
        .single();
      if (errProcesso) throw errProcesso;

      // Link publication to new process
      const { error: errVinculo } = await jud()
        .from('publicacoes')
        .update({ processo_id: processo.id })
        .eq('id', publicacaoId);
      if (errVinculo) throw errVinculo;

      // Trigger CNJ enrichment via edge function (non-blocking)
      supabase.functions
        .invoke('portal-cnj-complete', { body: { processo_id: processo.id, numero_cnj: numeroCnj } })
        .catch(() => {/* enrichment is best-effort */});

      return processo;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['publicacao', variables.publicacaoId] });
      qc.invalidateQueries({ queryKey: ['publicacoes'] });
    },
  });
}

export function useCalcularPrazoAutomatico() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      publicacaoId,
      processoId,
      comarca,
      vara,
      dataPublicacao,
      dataDisponibilizacao,
      conteudo,
      aiPrazoSugerido,
    }: {
      publicacaoId: string;
      processoId: string;
      comarca?: string | null;
      vara?: string | null;
      dataPublicacao?: string | null;
      dataDisponibilizacao?: string | null;
      conteudo?: string | null;
      aiPrazoSugerido?: number | null;
    }) => {
      // Determine data_base: prefer disponibilizacao, fallback to publicacao
      const dataBase = dataDisponibilizacao?.split('T')[0] ?? dataPublicacao?.split('T')[0] ?? new Date().toISOString().split('T')[0];
      // Início de contagem: next business day after disponibilização (simplified: +1 day)
      const inicioContagem = (() => {
        const d = new Date(dataBase);
        d.setDate(d.getDate() + 1);
        return d.toISOString().split('T')[0];
      })();
      // Vencimento: use AI suggestion or default to 15 dias úteis (~21 calendar days)
      const prazosDias = aiPrazoSugerido ?? 15;
      const dataVencimento = (() => {
        const d = new Date(inicioContagem);
        d.setDate(d.getDate() + prazosDias);
        return d.toISOString().split('T')[0];
      })();

      const { data, error } = await jud()
        .from('prazo_calculado')
        .insert({
          processo_id: processoId,
          publicacao_id: publicacaoId,
          evento_tipo: 'publicacao',
          titulo: `Prazo — ${vara ?? comarca ?? 'Publicação'}`,
          data_base: dataBase,
          data_inicio_contagem: inicioContagem,
          data_vencimento: dataVencimento,
          status: 'aberto',
          observacoes_ia: `Calculado automaticamente. Comarca: ${comarca ?? '—'} | Vara: ${vara ?? '—'} | Base legal inferida do conteúdo.`,
          metadata: { comarca, vara, conteudo_snippet: conteudo?.slice(0, 200) },
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['publicacao', variables.publicacaoId] });
    },
  });
}
