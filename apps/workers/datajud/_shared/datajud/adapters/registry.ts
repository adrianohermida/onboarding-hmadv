/**
 * DataJud adapter registry.
 *
 * `parseDataJudPayload` normalises raw DataJud API hits into the canonical
 * CanonicalProcesso shape, recording which schema/grau/sistema the parser
 * resolved so operators can audit enrichment coverage.
 *
 * The design is a single default adapter — tribunal-specific overrides can be
 * registered later by pushing entries to ADAPTERS.
 */

import type { CanonicalProcesso } from './types.ts';

interface ParseInput {
  numeroProcesso: string;
  tribunal: string;
  grau: string | null;
  sistema: string | null;
  payload: Record<string, unknown>;
}

type AdapterFn = (input: ParseInput) => CanonicalProcesso;

// Adapter registry — add tribunal-specific parsers here when needed
const ADAPTERS: Array<{ match: (i: ParseInput) => boolean; parse: AdapterFn }> = [];

// ── Default adapter (handles all tribunals generically) ──────────────────────

function defaultAdapter(input: ParseInput): CanonicalProcesso {
  const src = input.payload;

  function str(v: unknown): string | undefined {
    const s = String(v ?? '').trim();
    return s || undefined;
  }

  function num(v: unknown): number | undefined {
    const n = Number(v);
    return Number.isFinite(n) && n !== 0 ? n : undefined;
  }

  // Classe
  const classeRaw = src.classe as Record<string, unknown> | string | undefined;
  const classe_nome = typeof classeRaw === 'object'
    ? str(classeRaw?.nome ?? classeRaw?.descricao)
    : str(classeRaw);
  const classe_codigo = typeof classeRaw === 'object'
    ? str(classeRaw?.codigo)
    : undefined;

  // Assunto
  const assuntosRaw = Array.isArray(src.assuntos) ? src.assuntos as Record<string, unknown>[] : [];
  const assuntos = assuntosRaw.map((a) => ({
    nome: str(a.nome ?? a.descricao),
    codigo: str(a.codigo),
  })).filter((a) => a.nome);
  const assunto_principal_nome = assuntos[0]?.nome;

  // Órgão julgador
  const orgaoRaw = src.orgaoJulgador as Record<string, unknown> | string | undefined;
  const orgao_julgador_nome = typeof orgaoRaw === 'object'
    ? str(orgaoRaw?.nome ?? orgaoRaw?.descricao)
    : str(orgaoRaw ?? src.orgao_julgador);
  const orgao_julgador_codigo = typeof orgaoRaw === 'object'
    ? str(orgaoRaw?.codigo)
    : str(src.orgao_julgador_codigo);

  // Sistema
  const sistemaRaw = src.sistema as Record<string, unknown> | string | undefined;
  const sistema = input.sistema
    ?? (typeof sistemaRaw === 'object'
      ? str(sistemaRaw?.sigla ?? sistemaRaw?.codigo ?? sistemaRaw?.nome)
      : str(sistemaRaw));

  // Partes
  const partesRaw = Array.isArray(src.partes) ? src.partes as Record<string, unknown>[] : [];
  const partes = partesRaw.map((p) => ({
    nome: str(p.nome),
    tipo: str(p.polo ?? p.tipo),
    polo: str(p.polo ?? p.tipo),
    cpf_cnpj: str(p.documento ?? p.cpf ?? p.cnpj),
    advogados: Array.isArray(p.advogados)
      ? (p.advogados as Record<string, unknown>[]).map((a) => ({
          nome: str(a.nome),
          oab: str(a.oab ?? a.numeroOAB),
        }))
      : undefined,
  }));

  // Movimentos
  const movsRaw = Array.isArray(src.movimentos) ? src.movimentos as Record<string, unknown>[] : [];
  const movimentos = movsRaw.map((m) => ({
    codigo: num(m.codigo),
    descricao: str(m.nome ?? m.descricao),
    data: str(m.dataHora ?? m.data),
    complementos: Array.isArray(m.complementosTabelados) ? m.complementosTabelados : undefined,
  }));

  // Situação / status
  const situacaoRaw = src.situacao as Record<string, unknown> | undefined;

  // Dates
  const data_ajuizamento = str(
    src.dataAjuizamento ?? src.data_ajuizamento ?? src.dataDistribuicao
  );
  const data_ultima_movimentacao = str(
    src.dataUltimaAtualizacao ?? src.data_ultima_movimentacao ?? movimentos[0]?.data
  );

  return {
    numero_cnj: str(input.numeroProcesso),
    numero_processo: str(input.numeroProcesso),

    classe_nome,
    classe_codigo,
    area: str(src.area ?? src.ramo),

    assunto_principal_nome,
    assuntos: assuntos.length > 0 ? assuntos as { nome?: string; codigo?: string }[] : undefined,

    orgao_julgador_nome,
    orgao_julgador_codigo,

    tribunal: str(src.tribunal ?? input.tribunal),
    grau: str(src.grau ?? input.grau),
    sistema,
    formato: str(src.formato ?? src.nivelSigilo),

    data_ajuizamento,
    data_distribuicao: str(src.dataDistribuicao ?? src.data_distribuicao),
    data_ultima_movimentacao,

    valor_causa: num(src.valorCausa ?? src.valor_causa) ?? null,
    segredo_justica: src.nivelSigilo != null
      ? String(src.nivelSigilo) !== '0'
      : undefined,

    partes: partes.length > 0 ? partes : undefined,
    movimentos: movimentos.length > 0 ? movimentos : undefined,

    // Audit metadata
    parser_tribunal_schema: `default:${input.tribunal}`,
    parser_grau: str(input.grau),
    parser_sistema: sistema,
  };
}

// ── Public API ───────────────────────────────────────────────────────────────

export function parseDataJudPayload(input: ParseInput): CanonicalProcesso {
  const adapter = ADAPTERS.find((a) => a.match(input));
  return adapter ? adapter.parse(input) : defaultAdapter(input);
}
