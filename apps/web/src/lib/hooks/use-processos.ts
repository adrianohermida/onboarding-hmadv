import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

// Acessa o schema judiciario
function jud() {
  return (createClient() as any).schema('judiciario');
}

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface Processo {
  id: string;
  numero_cnj: string | null;
  tribunal: string | null;
  comarca: string | null;
  ramo: string | null;
  orgao_julgador: string | null;
  classe: string | null;
  assunto: string | null;
  status: string | null;
  prioridade: string | null;
  valor_causa: number | null;
  segredo_justica: boolean | null;
  monitoramento_ativo: boolean | null;
  data_ajuizamento: string | null;
  data_ultima_movimentacao: string | null;
  created_at: string;
  updated_at: string;
}

export interface Movimentacao {
  id: string;
  processo_id: string;
  data_movimentacao: string;
  conteudo: string | null;
  fonte: string | null;
  tipo: string | null;
}

export interface Audiencia {
  id: string;
  processo_id: string | null;
  tipo: string | null;
  data_audiencia: string;
  descricao: string | null;
  local: string | null;
  situacao: string | null;
  observacoes: string | null;
  created_at: string;
}

export interface PrazoCalculado {
  id: string;
  processo_id: string | null;
  publicacao_id: string | null;
  titulo: string | null;
  descricao: string | null;
  data_vencimento: string;
  status: string | null;
  prioridade: string | null;
  base_legal: string | null;
  created_at: string;
}

export interface Parte {
  id: string;
  processo_id: string | null;
  nome: string;
  tipo: string | null;
  polo: string | null;
  documento: string | null;
  advogado: string | null;
  representada_pelo_escritorio: boolean | null;
  cliente_hmadv: boolean | null;
}

export interface FinanceiroProcessual {
  id: string;
  processo_id: string | null;
  tipo: string | null;
  descricao: string | null;
  valor: number | null;
  data_vencimento: string | null;
  status: string | null;
  comprovante_url: string | null;
  created_at: string;
}

export interface RiscoProcessual {
  id: string;
  processo_id: string | null;
  grau_risco: string | null;
  probabilidade_sucesso: number | null;
  descricao: string | null;
  atualizado_em: string | null;
}

// ─── Hooks de leitura ────────────────────────────────────────────────────────

export function useProcessos() {
  return useQuery<Processo[]>({
    queryKey: ['processos-judiciario'],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await jud()
        .from('processos')
        .select('id, numero_cnj, tribunal, comarca, ramo, orgao_julgador, classe, assunto, status, prioridade, valor_causa, segredo_justica, monitoramento_ativo, data_ajuizamento, data_ultima_movimentacao, created_at, updated_at')
        .order('data_ultima_movimentacao', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useMovimentacoes(processoId: string | null) {
  return useQuery<Movimentacao[]>({
    queryKey: ['movimentacoes', processoId],
    enabled: !!processoId,
    staleTime: 30_000,
    queryFn: async () => {
      const { data } = await jud()
        .from('movimentacoes')
        .select('id, processo_id, data_movimentacao, conteudo, fonte, tipo')
        .eq('processo_id', processoId)
        .order('data_movimentacao', { ascending: false })
        .limit(50);
      return data ?? [];
    },
  });
}

export function useAudiencias(processoId?: string | null) {
  return useQuery<Audiencia[]>({
    queryKey: ['audiencias', processoId ?? 'all'],
    staleTime: 30_000,
    queryFn: async () => {
      let q = jud()
        .from('audiencias')
        .select('id, processo_id, tipo, data_audiencia, descricao, local, situacao, observacoes, created_at')
        .order('data_audiencia', { ascending: true });
      if (processoId) q = q.eq('processo_id', processoId);
      const { data } = await q.limit(100);
      return data ?? [];
    },
  });
}

export function usePrazos(processoId?: string | null) {
  return useQuery<PrazoCalculado[]>({
    queryKey: ['prazos', processoId ?? 'all'],
    staleTime: 30_000,
    queryFn: async () => {
      let q = jud()
        .from('prazo_calculado')
        .select('id, processo_id, publicacao_id, titulo, descricao, data_vencimento, status, prioridade, base_legal, created_at')
        .order('data_vencimento', { ascending: true });
      if (processoId) q = q.eq('processo_id', processoId);
      const { data } = await q.limit(200);
      return data ?? [];
    },
  });
}

export function usePartes(processoId: string | null) {
  return useQuery<Parte[]>({
    queryKey: ['partes', processoId],
    enabled: !!processoId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await jud()
        .from('partes')
        .select('id, processo_id, nome, tipo, polo, documento, advogado, representada_pelo_escritorio, cliente_hmadv')
        .eq('processo_id', processoId);
      return data ?? [];
    },
  });
}

export function useFinanceiroProcessual(processoId: string | null) {
  return useQuery<FinanceiroProcessual[]>({
    queryKey: ['financeiro-processual', processoId],
    enabled: !!processoId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await jud()
        .from('financeiro_processual')
        .select('id, processo_id, tipo, descricao, valor, data_vencimento, status, comprovante_url, created_at')
        .eq('processo_id', processoId)
        .order('created_at', { ascending: false });
      return data ?? [];
    },
  });
}

export function useRisco(processoId: string | null) {
  return useQuery<RiscoProcessual | null>({
    queryKey: ['risco', processoId],
    enabled: !!processoId,
    staleTime: 120_000,
    queryFn: async () => {
      const { data } = await jud()
        .from('riscos_processuais')
        .select('id, processo_id, grau_risco, probabilidade_sucesso, descricao, atualizado_em')
        .eq('processo_id', processoId)
        .maybeSingle();
      return data ?? null;
    },
  });
}

// ─── Hooks de mutação ────────────────────────────────────────────────────────

export function useAtualizarProcesso() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Pick<Processo, 'status' | 'prioridade' | 'monitoramento_ativo'>> }) => {
      const { error } = await jud()
        .from('processos')
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['processos-judiciario'] });
    },
  });
}

export function useCriarAudiencia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (nova: Omit<Audiencia, 'id' | 'created_at'>) => {
      const { error } = await jud()
        .from('audiencias')
        .insert(nova);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['audiencias', vars.processo_id] });
      qc.invalidateQueries({ queryKey: ['audiencias', 'all'] });
    },
  });
}

export function useAtualizarAudiencia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, processoId, patch }: { id: string; processoId: string | null; patch: Partial<Audiencia> }) => {
      const { error } = await jud().from('audiencias').update(patch).eq('id', id);
      if (error) throw error;
      return processoId;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['audiencias', vars.processoId] });
      qc.invalidateQueries({ queryKey: ['audiencias', 'all'] });
    },
  });
}

export function useCriarPrazoManual() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (novo: Omit<PrazoCalculado, 'id' | 'created_at'>) => {
      const { error } = await jud().from('prazo_calculado').insert(novo);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['prazos', vars.processo_id] });
      qc.invalidateQueries({ queryKey: ['prazos', 'all'] });
    },
  });
}

export function useAtualizarPrazo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, processoId, patch }: { id: string; processoId: string | null; patch: Partial<PrazoCalculado> }) => {
      const { error } = await jud().from('prazo_calculado').update(patch).eq('id', id);
      if (error) throw error;
      return processoId;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['prazos', vars.processoId] });
      qc.invalidateQueries({ queryKey: ['prazos', 'all'] });
    },
  });
}

export function useCriarFinanceiro() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (novo: Omit<FinanceiroProcessual, 'id' | 'created_at'>) => {
      const { error } = await jud().from('financeiro_processual').insert(novo);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['financeiro-processual', vars.processo_id] });
    },
  });
}

// ─── Novos tipos e hooks — Central de Processos ──────────────────────────────

export interface PublicacaoProcesso {
  id: string;
  data_publicacao: string | null;
  ai_tipo_ato: string | null;
  ai_urgencia: string | null;
  conteudo: string | null;
  nome_cliente: string | null;
  lido: boolean | null;
}

export interface TarefaProcesso {
  id: string;
  title: string;
  description: string | null;
  status: string | null;
  due_date: string | null;
  created_at: string;
}

export interface DocumentoProcesso {
  id: string;
  nome_arquivo: string | null;
  tipo: string | null;
  workflow_status: string | null;
  storage_path: string | null;
  created_at: string;
  user_id: string;
}

export function usePublicacoesProcesso(processoId: string | null) {
  return useQuery<PublicacaoProcesso[]>({
    queryKey: ['publicacoes-processo', processoId],
    enabled: !!processoId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await jud()
        .from('publicacoes')
        .select('id, data_publicacao, ai_tipo_ato, ai_urgencia, conteudo, nome_cliente, lido')
        .eq('processo_id', processoId)
        .order('data_publicacao', { ascending: false })
        .limit(50);
      return data ?? [];
    },
  });
}

export function useTarefasProcesso(processoId: string | null) {
  return useQuery<TarefaProcesso[]>({
    queryKey: ['tarefas-processo', processoId],
    enabled: !!processoId,
    staleTime: 30_000,
    queryFn: async () => {
      const { data } = await createClient()
        .from('re_tasks')
        .select('id, title, description, status, due_date, created_at')
        .order('due_date', { ascending: true })
        .limit(50);
      return data ?? [];
    },
  });
}

export function useDocumentosProcesso(userIds: string[]) {
  return useQuery<DocumentoProcesso[]>({
    queryKey: ['documentos-processo', userIds.join(',')],
    enabled: userIds.length > 0,
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await createClient()
        .from('portal_documentos')
        .select('id, nome_arquivo, tipo, workflow_status, storage_path, created_at, user_id')
        .in('user_id', userIds)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(100);
      return data ?? [];
    },
  });
}

// ─── Hook paginado — lista principal de processos ────────────────────────────

export const PROCESSOS_PAGE_SIZE = 30;

export interface ProcessosFiltros {
  search: string;
  status: string | null;
  prioridade: string | null;
}

export interface ProcessosPaginados {
  data: Processo[];
  total: number;
  page: number;
}

export function useProcessosPaginados(filtros: ProcessosFiltros, page: number) {
  return useQuery<ProcessosPaginados>({
    queryKey: ['processos-paginados', filtros, page],
    staleTime: 30_000,
    queryFn: async () => {
      const from = page * PROCESSOS_PAGE_SIZE;
      const to = from + PROCESSOS_PAGE_SIZE - 1;

      let q = jud()
        .from('processos')
        .select(
          'id, numero_cnj, tribunal, comarca, ramo, orgao_julgador, classe, assunto, status, prioridade, valor_causa, segredo_justica, monitoramento_ativo, data_ajuizamento, data_ultima_movimentacao, created_at, updated_at',
          { count: 'exact' }
        )
        .order('data_ultima_movimentacao', { ascending: false })
        .range(from, to);

      const q2 = filtros.search.trim().length >= 2
        ? q.or(
            `numero_cnj.ilike.%${filtros.search}%,tribunal.ilike.%${filtros.search}%,comarca.ilike.%${filtros.search}%,classe.ilike.%${filtros.search}%,assunto.ilike.%${filtros.search}%,orgao_julgador.ilike.%${filtros.search}%`
          )
        : q;

      const q3 = filtros.status ? q2.eq('status', filtros.status) : q2;
      const q4 = filtros.prioridade ? q3.eq('prioridade', filtros.prioridade) : q3;

      const { data, error, count } = await q4;
      if (error) throw error;
      return { data: data ?? [], total: count ?? 0, page };
    },
  });
}

// ─── Prazos — paginação server-side ──────────────────────────────────────────

export const PRAZOS_PAGE_SIZE = 50;

export interface PrazosPaginadosFiltros {
  search: string;
  status: string | null;
  prioridade: string | null;
  urgencia: 'vencida' | 'hoje' | 'semana' | 'ok' | null;
}

export interface PrazosPaginados {
  data: PrazoCalculado[];
  total: number;
  page: number;
}

export function usePrazosPaginados(filtros: PrazosPaginadosFiltros, page: number) {
  return useQuery<PrazosPaginados>({
    queryKey: ['prazos-paginados', filtros, page],
    staleTime: 30_000,
    queryFn: async () => {
      const from = page * PRAZOS_PAGE_SIZE;
      const to   = from + PRAZOS_PAGE_SIZE - 1;
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const hojeStr   = hoje.toISOString();
      const amanhaStr = new Date(hoje.getTime() + 86_400_000).toISOString();
      const semanaStr = new Date(hoje.getTime() + 7 * 86_400_000).toISOString();

      let q = jud()
        .from('prazo_calculado')
        .select(
          'id, processo_id, publicacao_id, titulo, descricao, data_vencimento, status, prioridade, base_legal, created_at',
          { count: 'exact' }
        )
        .order('data_vencimento', { ascending: true })
        .range(from, to);

      if (filtros.search.trim().length >= 2)
        q = q.or(`titulo.ilike.%${filtros.search}%,base_legal.ilike.%${filtros.search}%`);
      if (filtros.status)    q = q.eq('status', filtros.status);
      if (filtros.prioridade) q = q.eq('prioridade', filtros.prioridade);
      if (filtros.urgencia) {
        switch (filtros.urgencia) {
          case 'vencida': q = q.lt('data_vencimento', hojeStr); break;
          case 'hoje':    q = q.gte('data_vencimento', hojeStr).lt('data_vencimento', amanhaStr); break;
          case 'semana':  q = q.gte('data_vencimento', amanhaStr).lt('data_vencimento', semanaStr); break;
          case 'ok':      q = q.gte('data_vencimento', semanaStr); break;
        }
      }

      const { data, error, count } = await q;
      if (error) throw error;
      return { data: data ?? [], total: count ?? 0, page };
    },
  });
}

export function usePrazosContagens() {
  return useQuery<{ vencida: number; hoje: number; semana: number; ok: number }>({
    queryKey: ['prazos-contagens'],
    staleTime: 60_000,
    queryFn: async () => {
      const base = new Date();
      base.setHours(0, 0, 0, 0);
      const hojeStr   = base.toISOString();
      const amanhaStr = new Date(base.getTime() + 86_400_000).toISOString();
      const semanaStr = new Date(base.getTime() + 7 * 86_400_000).toISOString();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const excluir = (q: any) => q.neq('status', 'concluido').neq('status', 'cancelado');

      const [a, b, c, d] = await Promise.all([
        excluir(jud().from('prazo_calculado').select('id', { count: 'exact', head: true }))
          .lt('data_vencimento', hojeStr),
        excluir(jud().from('prazo_calculado').select('id', { count: 'exact', head: true }))
          .gte('data_vencimento', hojeStr).lt('data_vencimento', amanhaStr),
        excluir(jud().from('prazo_calculado').select('id', { count: 'exact', head: true }))
          .gte('data_vencimento', amanhaStr).lt('data_vencimento', semanaStr),
        excluir(jud().from('prazo_calculado').select('id', { count: 'exact', head: true }))
          .gte('data_vencimento', semanaStr),
      ]);
      return { vencida: a.count ?? 0, hoje: b.count ?? 0, semana: c.count ?? 0, ok: d.count ?? 0 };
    },
  });
}

// ─── Audiências — paginação server-side ──────────────────────────────────────

export const AUDIENCIAS_PAGE_SIZE = 50;

export interface AudienciasPaginadasFiltros {
  search: string;
  situacao: string | null;
  periodo: 'futuras' | 'passadas';
}

export interface AudienciasPaginadas {
  data: Audiencia[];
  total: number;
  page: number;
}

export function useAudienciasPaginadas(filtros: AudienciasPaginadasFiltros, page: number) {
  return useQuery<AudienciasPaginadas>({
    queryKey: ['audiencias-paginadas', filtros, page],
    staleTime: 30_000,
    queryFn: async () => {
      const from = page * AUDIENCIAS_PAGE_SIZE;
      const to   = from + AUDIENCIAS_PAGE_SIZE - 1;
      const agora = new Date().toISOString();

      let q = jud()
        .from('audiencias')
        .select(
          'id, processo_id, tipo, data_audiencia, descricao, local, situacao, observacoes, created_at',
          { count: 'exact' }
        )
        .range(from, to);

      if (filtros.periodo === 'futuras') {
        q = q.gte('data_audiencia', agora).order('data_audiencia', { ascending: true });
      } else {
        q = q.lt('data_audiencia', agora).order('data_audiencia', { ascending: false });
      }
      if (filtros.search.trim().length >= 2)
        q = q.or(`tipo.ilike.%${filtros.search}%,local.ilike.%${filtros.search}%,observacoes.ilike.%${filtros.search}%`);
      if (filtros.situacao) q = q.eq('situacao', filtros.situacao);

      const { data, error, count } = await q;
      if (error) throw error;
      return { data: data ?? [], total: count ?? 0, page };
    },
  });
}

export function useAudienciasContagens() {
  return useQuery<{ proximas: number; passadas: number }>({
    queryKey: ['audiencias-contagens'],
    staleTime: 60_000,
    queryFn: async () => {
      const agora = new Date().toISOString();
      const [p, h] = await Promise.all([
        jud().from('audiencias').select('id', { count: 'exact', head: true }).gte('data_audiencia', agora),
        jud().from('audiencias').select('id', { count: 'exact', head: true }).lt('data_audiencia', agora),
      ]);
      return { proximas: p.count ?? 0, passadas: h.count ?? 0 };
    },
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function prazoUrgencia(data: string): 'vencida' | 'hoje' | 'semana' | 'ok' {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const venc = new Date(data);
  venc.setHours(0, 0, 0, 0);
  const diff = Math.round((venc.getTime() - hoje.getTime()) / 86_400_000);
  if (diff < 0) return 'vencida';
  if (diff === 0) return 'hoje';
  if (diff <= 7) return 'semana';
  return 'ok';
}

export const URGENCIA_PRAZO_CONFIG = {
  vencida: { label: 'Vencida',       cls: 'bg-rose-500/10 text-rose-500 ring-rose-500/20' },
  hoje:    { label: 'Vence hoje',    cls: 'bg-orange-500/10 text-orange-500 ring-orange-500/20' },
  semana:  { label: 'Esta semana',   cls: 'bg-amber-500/10 text-amber-500 ring-amber-500/20' },
  ok:      { label: 'No prazo',      cls: 'bg-green-500/10 text-green-500 ring-green-500/20' },
};

export const STATUS_PROCESSO_CONFIG: Record<string, { label: string; cls: string }> = {
  em_andamento:   { label: 'Em andamento',  cls: 'bg-blue-500/10 text-blue-500' },
  suspenso:       { label: 'Suspenso',      cls: 'bg-amber-500/10 text-amber-500' },
  arquivado:      { label: 'Arquivado',     cls: 'bg-muted text-muted-foreground' },
  encerrado:      { label: 'Encerrado',     cls: 'bg-green-500/10 text-green-500' },
  aguardando:     { label: 'Aguardando',    cls: 'bg-violet-500/10 text-violet-500' },
};

export const PRIORIDADE_PROCESSO_CONFIG: Record<string, { label: string; cls: string }> = {
  critica:  { label: 'Crítica', cls: 'bg-rose-500/10 text-rose-500 ring-rose-500/20' },
  alta:     { label: 'Alta',    cls: 'bg-orange-500/10 text-orange-500 ring-orange-500/20' },
  media:    { label: 'Média',   cls: 'bg-amber-500/10 text-amber-500 ring-amber-500/20' },
  baixa:    { label: 'Baixa',   cls: 'bg-green-500/10 text-green-500 ring-green-500/20' },
};
