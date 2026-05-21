/**
 * Canonical processo type produced by DataJud adapter parsers.
 * All fields are optional — adapters fill only what the specific tribunal API returns.
 */
export interface CanonicalProcesso {
  numero_cnj?: string;
  numero_processo?: string;

  classe_nome?: string;
  classe_codigo?: string;
  area?: string;

  assunto_principal_nome?: string;
  assuntos?: Array<{ nome?: string; codigo?: string }>;

  orgao_julgador_nome?: string;
  orgao_julgador_codigo?: string;

  tribunal?: string;
  grau?: string;
  sistema?: string;
  formato?: string;

  data_ajuizamento?: string;
  data_distribuicao?: string;
  data_ultima_movimentacao?: string;

  valor_causa?: number | null;
  segredo_justica?: boolean | string | null;

  partes?: Array<{
    nome?: string;
    tipo?: string;
    polo?: string;
    cpf_cnpj?: string;
    advogados?: Array<{ nome?: string; oab?: string }>;
  }>;

  movimentos?: Array<{
    codigo?: number;
    descricao?: string;
    data?: string;
    complementos?: unknown[];
  }>;

  // Parser audit metadata
  parser_tribunal_schema?: string;
  parser_grau?: string;
  parser_sistema?: string;
}
