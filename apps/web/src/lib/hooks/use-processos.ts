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
  titulo: string | null;
  polo_ativo: string | null;
  polo_passivo: string | null;
  responsavel: string | null;
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
      const baseSelect = 'id, numero_cnj, tribunal, comarca, ramo, orgao_julgador, classe, assunto, status, prioridade, valor_causa, segredo_justica, monitoramento_ativo, data_ajuizamento, data_ultima_movimentacao, created_at, updated_at';
      const extendedSelect = `id, numero_cnj, titulo, polo_ativo, polo_passivo, responsavel, ${baseSelect.replace('id, numero_cnj, ', '')}`;

      const run = async (selectColumns: string) => {
        const { data, error } = await jud()
          .from('processos')
          .select(selectColumns)
          .order('data_ultima_movimentacao', { ascending: false })
          .limit(200);
        if (error) throw error;
        return data ?? [];
      };

      try {
        return await run(extendedSelect);
      } catch (error: any) {
        const message = String(error?.message || '');
        if (!/polo_ativo|polo_passivo|responsavel|titulo/i.test(message)) throw error;
        const rows = await run(baseSelect);
        return rows.map((row: any) => ({ ...row, titulo: null, polo_ativo: null, polo_passivo: null, responsavel: null }));
      }
    },
  });
}

export function useResponsaveisInternos() {
  return useQuery<Array<{ user_id: string; role: string }>>({
    queryKey: ['responsaveis-internos'],
    staleTime: 120_000,
    queryFn: async () => {
      const { data, error } = await createClient()
        .from('portal_workspace_members')
        .select('user_id, role')
        .in('role', ['master_admin', 'tenant_admin', 'advogado', 'colaborador']);
      if (error) throw error;
      return (data ?? []) as Array<{ user_id: string; role: string }>;
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
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Pick<Processo, 'status' | 'prioridade' | 'monitoramento_ativo' | 'responsavel'>> }) => {
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

export function useExcluirProcesso() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await jud().from('processos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['processos-paginados'] });
      qc.invalidateQueries({ queryKey: ['processos-judiciario'] });
    },
  });
}

export function useBulkAtualizarProcessos() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ids, patch }: { ids: string[]; patch: Partial<Pick<Processo, 'status' | 'monitoramento_ativo' | 'responsavel'>> }) => {
      if (!ids.length) return;
      const { error } = await jud()
        .from('processos')
        .update({ ...patch, updated_at: new Date().toISOString() })
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['processos-paginados'] });
      qc.invalidateQueries({ queryKey: ['processos-judiciario'] });
    },
  });
}

export function useBulkExcluirProcessos() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      if (!ids.length) return;
      const { error } = await jud().from('processos').delete().in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['processos-paginados'] });
      qc.invalidateQueries({ queryKey: ['processos-judiciario'] });
    },
  });
}

export function useBulkMesclarProcessos() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ destinationId, sourceIds }: { destinationId: string; sourceIds: string[] }) => {
      if (!destinationId || !sourceIds.length) return;
      const { error } = await jud()
        .from('processos')
        .update({ status: 'arquivado', updated_at: new Date().toISOString() })
        .in('id', sourceIds.filter((id) => id !== destinationId));
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['processos-paginados'] });
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
  responsavel: string | null;
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
      const search = String(filtros.search || '').trim();
      const cnjDigits = onlyDigits(search);
      const cnjStructured = cnjDigits.length === 20 ? formatCnjDigits(cnjDigits) : '';

      const baseSelect = 'id, numero_cnj, tribunal, comarca, ramo, orgao_julgador, classe, assunto, status, prioridade, valor_causa, segredo_justica, monitoramento_ativo, data_ajuizamento, data_ultima_movimentacao, created_at, updated_at';
      const extendedSelect = `id, numero_cnj, titulo, polo_ativo, polo_passivo, responsavel, ${baseSelect.replace('id, numero_cnj, ', '')}`;

      const run = async (extended = true) => {
        let q = jud()
          .from('processos')
          .select(extended ? extendedSelect : baseSelect, { count: 'exact' })
          .order('data_ultima_movimentacao', { ascending: false })
          .range(from, to);

        if (search.length >= 2) {
          const ors = [
            `numero_cnj.ilike.%${search}%`,
            cnjStructured ? `numero_cnj.ilike.%${cnjStructured}%` : '',
            `tribunal.ilike.%${search}%`,
            `comarca.ilike.%${search}%`,
            `classe.ilike.%${search}%`,
            `assunto.ilike.%${search}%`,
            `orgao_julgador.ilike.%${search}%`,
            extended ? `responsavel.ilike.%${search}%` : '',
            extended ? `polo_ativo.ilike.%${search}%` : '',
            extended ? `polo_passivo.ilike.%${search}%` : '',
          ].filter(Boolean);
          q = q.or(ors.join(','));
        }

        if (filtros.status === 'ativo') q = q.in('status', ['em_andamento', 'aguardando', 'ativo']);
        else if (filtros.status === 'baixado') q = q.in('status', ['baixado', 'encerrado', 'arquivado']);
        else if (filtros.status) q = q.eq('status', filtros.status);

        if (filtros.prioridade) q = q.eq('prioridade', filtros.prioridade);
        if (extended && filtros.responsavel) q = q.ilike('responsavel', `%${filtros.responsavel}%`);

        const { data, error, count } = await q;
        if (error) throw error;
        const rows = data ?? [];
        return {
          data: extended ? rows : rows.map((row: any) => ({ ...row, titulo: null, polo_ativo: null, polo_passivo: null, responsavel: null })),
          total: count ?? 0,
          page,
        };
      };

      try {
        return await run(true);
      } catch (error: any) {
        const message = String(error?.message || '');
        if (!/polo_ativo|polo_passivo|responsavel|titulo/i.test(message)) throw error;
        return run(false);
      }
    },
  });
}

export function onlyDigits(value: string | null | undefined) {
  return String(value || '').replace(/\D/g, '');
}

export function formatCnjDigits(digits: string) {
  const normalized = onlyDigits(digits);
  if (normalized.length !== 20) return normalized;
  return `${normalized.slice(0, 7)}-${normalized.slice(7, 9)}.${normalized.slice(9, 13)}.${normalized.slice(13, 14)}.${normalized.slice(14, 16)}.${normalized.slice(16, 20)}`;
}

export function isValidCnj(input: string | null | undefined) {
  const digits = onlyDigits(input);
  if (digits.length !== 20) return false;
  const num = digits.slice(0, 7);
  const dv = Number(digits.slice(7, 9));
  const year = digits.slice(9, 13);
  const justice = digits.slice(13, 14);
  const court = digits.slice(14, 16);
  const origin = digits.slice(16, 20);
  const base = `${num}${year}${justice}${court}${origin}`;
  const expectedDv = 98 - Number(BigInt(base) % 97n);
  return expectedDv === dv;
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
