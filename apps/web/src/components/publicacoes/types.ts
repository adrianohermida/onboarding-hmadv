export type PublicacaoSecao =
  | 'caixa_entrada'
  | 'com_prazo'
  | 'urgentes'
  | 'lidas'
  | 'pendentes'
  | 'arquivadas'
  | 'triagem_ia'
  | 'sem_vinculo';

export interface PublicacaoFiltros {
  search: string;
  tribunal: string;
  urgencia: string;
  periodo: string;
  temPrazo: string;
  lido: string;
  tipoAto: string;
}

export const FILTROS_DEFAULT: PublicacaoFiltros = {
  search: '',
  tribunal: '',
  urgencia: '',
  periodo: '30d',
  temPrazo: '',
  lido: '',
  tipoAto: '',
};

export interface ProcessoResumo {
  id: string;
  numero_cnj: string | null;
  tribunal: string | null;
  comarca: string | null;
  status: string | null;
  classe: string | null;
  orgao_julgador: string | null;
}

export interface PrazoRegra {
  ato_praticado: string;
  prazo_dias: number | null;
  tipo_contagem: string;
  base_legal: string | null;
  artigo: string | null;
}

export interface PrazoCalculado {
  id: string;
  titulo: string;
  data_base: string;
  data_inicio_contagem: string;
  data_vencimento: string;
  status: string;
  prioridade: string | null;
  observacoes_ia: string | null;
  metadata: Record<string, unknown>;
  prazo_regra?: PrazoRegra | null;
}

export interface PrazoTarefa {
  id: number;
  tipo_prazo: string;
  data_publicacao: string | null;
  data_inicio_prazo: string | null;
  data_fim_prazo: string | null;
  dias_prazo: number | null;
  memoria_calculo: string | null;
  status: string;
}

export interface Audiencia {
  id: string;
  tipo: string | null;
  data_audiencia: string | null;
  descricao: string | null;
  local: string | null;
  situacao: string;
  origem: string;
}

export interface Movimento {
  id: string;
  descricao: string | null;
  data_movimento: string | null;
  codigo: number | null;
}

export interface Movimentacao {
  id: string;
  data_movimentacao: string | null;
  conteudo: string | null;
  fonte: string;
}

export interface Parte {
  id: string;
  nome: string | null;
  tipo: string | null;
  polo: string | null;
  representada_pelo_escritorio: boolean;
  cliente_hmadv: boolean;
}

export interface PublicacaoDetalhe {
  id: string;
  processo_id: string | null;
  data_publicacao: string | null;
  data_disponibilizacao: string | null;
  conteudo: string | null;
  despacho: string | null;
  tem_prazo: boolean | null;
  prazo_data: string | null;
  lido: boolean | null;
  ativo: boolean | null;
  nome_cliente: string | null;
  nome_diario: string | null;
  descricao_diario: string | null;
  nome_caderno_diario: string | null;
  cidade_comarca_descricao: string | null;
  vara_descricao: string | null;
  numero_processo_api: string | null;
  adriano_polo: string | null;
  palavras_chave: string | null;
  numero_edicao: string | null;
  pagina_inicial: string | null;
  pagina_final: string | null;
  comentario: string | null;
  ai_resumo: string | null;
  ai_tipo_ato: string | null;
  ai_prazo_sugerido: number | null;
  ai_urgencia: string | null;
  ai_enriquecido_at: string | null;
  data_hora_cadastro: string | null;
  processos: ProcessoResumo | null;
  prazo_calculado: PrazoCalculado[];
}

export interface Publicacao {
  id: string;
  processo_id: string | null;
  data_publicacao: string | null;
  conteudo: string | null;
  tem_prazo: boolean | null;
  prazo_data: string | null;
  lido: boolean | null;
  ativo: boolean | null;
  nome_cliente: string | null;
  nome_diario: string | null;
  cidade_comarca_descricao: string | null;
  vara_descricao: string | null;
  numero_processo_api: string | null;
  adriano_polo: string | null;
  ai_resumo: string | null;
  ai_tipo_ato: string | null;
  ai_prazo_sugerido: number | null;
  ai_urgencia: string | null;
  ai_enriquecido_at: string | null;
  data_hora_cadastro: string | null;
  processos: ProcessoResumo | null;
  prazo_calculado: { id: string; data_vencimento: string; status: string; prioridade: string | null }[];
}

export const URGENCIA_LABELS: Record<string, string> = {
  normal: 'Normal',
  media: 'Média',
  alta: 'Alta',
  urgente: 'Urgente',
  critica: 'Crítica',
};

export const URGENCIA_STYLES: Record<string, string> = {
  normal: 'bg-gray-100 text-gray-600 border-gray-200',
  media: 'bg-blue-50 text-blue-700 border-blue-200',
  alta: 'bg-amber-50 text-amber-700 border-amber-200',
  urgente: 'bg-orange-50 text-orange-700 border-orange-200',
  critica: 'bg-red-50 text-red-700 border-red-200',
};

export const SECAO_LABELS: Record<PublicacaoSecao, string> = {
  caixa_entrada: 'Caixa de Entrada',
  com_prazo: 'Com Prazo',
  urgentes: 'Urgentes',
  lidas: 'Lidas',
  pendentes: 'Pendentes',
  arquivadas: 'Arquivadas',
  triagem_ia: 'Triagem IA',
  sem_vinculo: 'Sem Vínculo Processual',
};

export interface NovaTarefa {
  titulo: string;
  descricao: string;
  due_date: string;
}

export interface NovaAudiencia {
  tipo: string;
  data_audiencia: string;
  descricao: string;
  local: string;
  situacao: string;
}
