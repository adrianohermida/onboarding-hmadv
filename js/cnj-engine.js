/**
 * cnj-engine.js
 * Motor de conformidade processual — Lei 14.181/2021 + Recomendação CNJ 125/2021
 * ──────────────────────────────────────────────────────────────────────────────
 * Constantes legais (Jan/2026):
 *   Salário Mínimo  → R$ 1.622,00 (Lei 14.663/2023, reajuste Jan/2026)
 *   Mínimo Existencial → 25% SM  (Decreto 11.150/2022)
 *   SELIC           → 13,75% a.a. (referência; atualizar conforme COPOM)
 *   Cap Cartão      → 200% valor original (Lei do Cartão, vigente jan/2024)
 *   Prazo max plano → 60 meses (art. 104-A CDC)
 */

/* ── Constantes legais ───────────────────────────────────────────────────── */
export const SALARIO_MINIMO    = 1622.00;
export const SELIC_ANUAL       = 0.1375;
export const SELIC_MENSAL      = Math.pow(1 + SELIC_ANUAL, 1 / 12) - 1;
export const CAP_CARTAO_FATOR  = 2.0;
export const PRAZO_MAX_MESES   = 60;
export const MINIMO_EXIST_FRAC = 0.25;

/* ── Utilitários ─────────────────────────────────────────────────────────── */

/**
 * Converte string "DD/MM/YYYY" ou "YYYY-MM-DD" para Date.
 * Retorna null se inválido.
 */
function parseDate(str) {
  if (!str) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return new Date(str + 'T00:00:00');
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
    const [d, m, y] = str.split('/');
    return new Date(`${y}-${m}-${d}T00:00:00`);
  }
  return null;
}

/**
 * Diferença em meses completos entre duas datas.
 */
function mesesEntre(dataA, dataB) {
  if (!dataA || !dataB) return 0;
  const a = dataA instanceof Date ? dataA : parseDate(dataA);
  const b = dataB instanceof Date ? dataB : parseDate(dataB);
  if (!a || !b) return 0;
  const diff = (b - a) / (1000 * 60 * 60 * 24 * 30.44);
  return Math.max(0, Math.round(diff));
}

/**
 * Formata número como moeda BRL.
 */
export function fmtBRL(valor) {
  return (valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * Parseia string de moeda BRL ("R$ 1.234,56") para número.
 */
export function parseBRL(str) {
  if (typeof str === 'number') return str;
  if (!str) return 0;
  return parseFloat(
    String(str)
      .replace(/[R$\s]/g, '')
      .replace(/\./g, '')
      .replace(',', '.')
  ) || 0;
}

/* ── Mínimo existencial ──────────────────────────────────────────────────── */

/**
 * Retorna o mínimo existencial mensal (Decreto 11.150/2022).
 * 25% do salário mínimo vigente.
 */
export function calcMinimoExistencial() {
  return SALARIO_MINIMO * MINIMO_EXIST_FRAC;
}

/* ── Correção por SELIC ──────────────────────────────────────────────────── */

/**
 * Corrige valor principal pela SELIC simples capitalizada.
 * Lei 14.905/2024 — índice único para dívidas civis.
 *
 * @param {number} valorPrincipal   — valor na data de vencimento
 * @param {string|Date} dataVencimento — data em que a dívida venceu
 * @param {string|Date} [dataBase]  — data de referência (default: hoje)
 * @returns {{ valorCorrigido: number, meses: number, jurosAcumulados: number }}
 */
export function corrigirPorSelic(valorPrincipal, dataVencimento, dataBase) {
  const base = dataBase ? (dataBase instanceof Date ? dataBase : parseDate(dataBase)) : new Date();
  const meses = mesesEntre(dataVencimento, base);
  const fator = Math.pow(1 + SELIC_MENSAL, meses);
  const valorCorrigido = valorPrincipal * fator;
  return {
    valorCorrigido,
    meses,
    jurosAcumulados: valorCorrigido - valorPrincipal,
    fator,
  };
}

/* ── Cap cartão de crédito 200% ──────────────────────────────────────────── */

/**
 * Verifica e aplica o teto de 200% sobre o valor original contratado.
 * Considera: saldo atual + total já pago ≤ 2 × valor original.
 *
 * @param {number} valorOriginal     — valor do limite/crédito contratado
 * @param {number} totalJaPago       — soma de todos os pagamentos efetuados
 * @param {number} saldoAtual        — saldo devedor atual (com encargos)
 * @returns {{ capAtingido: boolean, saldoPermitido: number, excedente: number, totalExposicao: number }}
 */
export function aplicarCapCartao(valorOriginal, totalJaPago, saldoAtual) {
  const teto          = valorOriginal * CAP_CARTAO_FATOR;
  const totalExposicao = (totalJaPago || 0) + (saldoAtual || 0);
  const excedente     = Math.max(0, totalExposicao - teto);
  const saldoPermitido = Math.max(0, saldoAtual - excedente);
  return {
    capAtingido:   excedente > 0,
    saldoPermitido,
    excedente,
    totalExposicao,
    teto,
  };
}

/* ── Amortização Price sem juros futuros ─────────────────────────────────── */

/**
 * Calcula o saldo devedor real excluindo juros futuros (tabela Price).
 * Útil para o pedido de reconhecimento do saldo sem capitalização abusiva.
 *
 * PV = PMT × (1 - (1+i)^-n) / i
 *
 * @param {number} pmt               — valor da parcela mensal
 * @param {number} taxaMensal        — taxa de juros mensal (decimal, ex: 0.0199)
 * @param {number} parcelasRestantes — número de parcelas ainda a vencer
 * @returns {number} — valor presente (saldo sem juros futuros)
 */
export function calcSaldoSemJurosFuturos(pmt, taxaMensal, parcelasRestantes) {
  if (!taxaMensal || taxaMensal <= 0) return pmt * parcelasRestantes;
  const i = taxaMensal;
  const n = parcelasRestantes;
  return pmt * (1 - Math.pow(1 + i, -n)) / i;
}

/* ── Análise por credor ──────────────────────────────────────────────────── */

/**
 * Processa um credor do Mapa de Credores e retorna os valores calculados.
 *
 * @param {Object} credor
 *   @param {string}  credor.nome
 *   @param {string}  credor.tipo              — 'cartao'|'emprestimo'|'financiamento'|'outros'
 *   @param {number}  credor.valorDeclarado     — saldo informado pelo cliente
 *   @param {number}  [credor.valorOriginal]    — valor contratado original
 *   @param {number}  [credor.totalJaPago]      — total já quitado
 *   @param {string}  [credor.dataVencimento]   — data do vencimento/inadimplência
 *   @param {number}  [credor.pmt]              — valor da parcela
 *   @param {number}  [credor.taxaMensal]       — taxa mensal (decimal)
 *   @param {number}  [credor.parcelasRestantes]
 * @returns {Object} — saldos calculados e flags de conformidade
 */
export function calcCredor(credor) {
  const result = {
    nome:             credor.nome || '',
    saldoDeclarado:   credor.valorDeclarado || 0,
    saldoBase:        credor.valorDeclarado || 0,
    saldoCorrigido:   credor.valorDeclarado || 0,
    capAplicado:      false,
    correcaoAplicada: false,
    saldoFinal:       credor.valorDeclarado || 0,
    alertas:          [],
  };

  // 1. Amortização Price (se parcela + taxa + restantes fornecidos)
  if (credor.pmt && credor.taxaMensal && credor.parcelasRestantes) {
    result.saldoBase = calcSaldoSemJurosFuturos(
      credor.pmt, credor.taxaMensal, credor.parcelasRestantes
    );
    if (result.saldoBase < result.saldoDeclarado) {
      result.alertas.push('Saldo sem juros futuros menor que o declarado (Price)');
    }
  }

  // 2. Correção SELIC (se data de vencimento fornecida)
  if (credor.dataVencimento) {
    const selic = corrigirPorSelic(result.saldoBase, credor.dataVencimento);
    result.saldoCorrigido    = selic.valorCorrigido;
    result.correcaoAplicada  = selic.meses > 0;
    result.mesesAtraso       = selic.meses;
    result.jurosSelicAcum    = selic.jurosAcumulados;
  } else {
    result.saldoCorrigido = result.saldoBase;
  }

  // 3. Cap 200% cartão (apenas para tipo 'cartao')
  if (credor.tipo === 'cartao' && credor.valorOriginal) {
    const cap = aplicarCapCartao(
      credor.valorOriginal,
      credor.totalJaPago || 0,
      result.saldoCorrigido
    );
    if (cap.capAtingido) {
      result.saldoCorrigido = cap.saldoPermitido;
      result.capAplicado    = true;
      result.excedenteCartao = cap.excedente;
      result.alertas.push(
        `Cap 200% cartão: excedente de ${fmtBRL(cap.excedente)} abatido`
      );
    }
  }

  result.saldoFinal = result.saldoCorrigido;
  return result;
}

/* ── Plano de pagamento ──────────────────────────────────────────────────── */

/**
 * Calcula a parcela possível e o plano de pagamento (art. 104-A CDC).
 *
 * @param {Object} params
 *   @param {number}  params.totalDividas      — soma dos saldos finais de todos os credores
 *   @param {number}  params.rendaDisponivel   — renda após mínimo existencial e despesas essenciais
 *   @param {number}  [params.prazoMeses=60]   — prazo máximo (default: 60)
 *   @param {number}  [params.carenciaMeses=0] — carência inicial sem pagamento
 * @returns {Object} — plano calculado
 */
export function calcPlanoPagamento({ totalDividas, rendaDisponivel, prazoMeses = PRAZO_MAX_MESES, carenciaMeses = 0 }) {
  const prazo    = Math.min(prazoMeses, PRAZO_MAX_MESES);
  const prazoUtil = Math.max(1, prazo - carenciaMeses);

  // Parcela mínima necessária (divisão simples — sem juros no plano, art. 104-A)
  const parcelaNecessaria = totalDividas / prazoUtil;

  // Parcela máxima que o devedor pode pagar
  const parcelaPossivel = Math.max(0, rendaDisponivel);

  // Percentual de comprometimento da renda disponível
  const percComprometido = rendaDisponivel > 0
    ? Math.min(1, parcelaNecessaria / rendaDisponivel)
    : 1;

  // Viabilidade: possível se parcela disponível cobre a necessária
  const viavel = parcelaPossivel >= parcelaNecessaria;

  // Prazo real necessário com a renda disponível (sem juros)
  const prazoNecessario = rendaDisponivel > 0
    ? Math.ceil(totalDividas / rendaDisponivel)
    : Infinity;

  return {
    totalDividas,
    prazoMeses:        prazo,
    carenciaMeses,
    prazoUtil,
    parcelaNecessaria,
    parcelaPossivel,
    percComprometido,
    viavel,
    prazoNecessario:   Math.min(prazoNecessario, 9999),
    alertas:           prazoNecessario > PRAZO_MAX_MESES
      ? [`Renda insuficiente para quitar em ${PRAZO_MAX_MESES} meses. Prazo necessário: ${prazoNecessario} meses.`]
      : [],
  };
}

/* ── Análise global ──────────────────────────────────────────────────────── */

/**
 * Análise financeira consolidada do caso.
 *
 * @param {Object} params
 *   @param {number}   params.rendaIndividual
 *   @param {number}   [params.rendaFamiliar]
 *   @param {Object}   params.despesas         — { luz, aluguel, condominio, agua, internet,
 *                                                  alimentacao, pensao, educacao, plano_saude,
 *                                                  medicamentos, impostos, outras }
 *   @param {Object[]} params.credores         — array de credores já processados por calcCredor()
 *   @param {number}   [params.prazoMeses=60]
 *   @param {number}   [params.carenciaMeses=0]
 * @returns {Object} — análise consolidada
 */
export function calcAnaliseGlobal({ rendaIndividual, rendaFamiliar, despesas = {}, credores = [], prazoMeses = PRAZO_MAX_MESES, carenciaMeses = 0 }) {
  const minimoExistencial  = calcMinimoExistencial();
  const rendaBase          = rendaFamiliar || rendaIndividual || 0;

  // Soma despesas mensais essenciais
  const totalDespesas = Object.values(despesas).reduce((acc, v) => acc + (parseBRL(v) || 0), 0);

  // Credores processados
  const credoresCalc = credores.map(c => calcCredor(c));

  // Total dívidas (saldos finais)
  const totalDividas = credoresCalc.reduce((acc, c) => acc + (c.saldoFinal || 0), 0);

  // Comprometimento mensal declarado (parcelas em aberto)
  const comprometimentoDeclarado = credores.reduce((acc, c) => acc + (parseBRL(c.parcela) || 0), 0);

  // Renda disponível após mínimo existencial + despesas
  const rendaDisponivel = Math.max(0, rendaBase - Math.max(minimoExistencial, totalDespesas));

  // Percentual comprometido
  const percComprometido = rendaBase > 0
    ? (comprometimentoDeclarado + totalDespesas) / rendaBase
    : 1;

  // Plano de pagamento
  const plano = calcPlanoPagamento({ totalDividas, rendaDisponivel, prazoMeses, carenciaMeses });

  return {
    minimoExistencial,
    rendaBase,
    totalDespesas,
    totalDividas,
    comprometimentoDeclarado,
    rendaDisponivel,
    percComprometido,
    credoresCalc,
    plano,
    nCredores: credores.length,
    alertas: [
      ...(percComprometido > 0.30
        ? [`Comprometimento de ${(percComprometido * 100).toFixed(1)}% da renda (acima de 30%)`]
        : []),
      ...plano.alertas,
    ],
  };
}

/* ── JSON estruturado CNJ ────────────────────────────────────────────────── */

/**
 * Constrói o JSON estruturado padrão CNJ a partir do objeto `caso`.
 * Este JSON pode alimentar: geração de petições, Freshdesk, IA, PDF.
 *
 * @param {Object} caso — dados completos do portal_casos
 * @returns {Object} — JSON estruturado conforme Anexo II CNJ
 */
export function buildCNJJson(caso) {
  const analise = calcAnaliseGlobal({
    rendaIndividual:  parseBRL(caso.renda),
    rendaFamiliar:    parseBRL(caso.renda_familiar),
    despesas:         caso.despesas || {},
    credores:         caso.credores_cnj || [],
    prazoMeses:       caso.plano_pagamento?.prazo_meses || PRAZO_MAX_MESES,
    carenciaMeses:    caso.plano_pagamento?.carencia_meses || 0,
  });

  return {
    _versao:      '1.0',
    _gerado_em:   new Date().toISOString(),
    _base_legal:  'Lei 14.181/2021 + Recomendação CNJ 125/2021',

    /* §1 — Identificação */
    cliente: {
      nome:          caso.full_name       || '',
      cpf:           caso.cpf             || '',
      data_nascimento: caso.data_nascimento || '',
      sexo:          caso.sexo            || '',
      estado_civil:  caso.estado_civil    || '',
      profissao:     caso.profissao       || '',
      situacao_profissional: caso.situacao_profissional || '',
      nome_mae:      caso.nome_mae        || '',
      naturalidade:  caso.naturalidade    || '',
      nacionalidade: caso.nacionalidade   || '',
      rg:            caso.rg              || '',
      rg_emissor:    caso.rg_emissor      || '',
      email:         caso.email           || '',
      telefones:     caso.telefones       || [],
      enderecos:     caso.enderecos       || [],
    },

    /* §2a-c — Dados socioeconômicos */
    socioeconomico: {
      renda_individual:  parseBRL(caso.renda),
      renda_familiar:    parseBRL(caso.renda_familiar),
      n_dependentes:     caso.n_dependentes || 0,
      dependentes:       caso.dependentes   || [],
      conjugue:          caso.conjugue      || null,
    },

    /* §2d-f — Despesas mensais */
    despesas: {
      ...(caso.despesas || {}),
      _total: analise.totalDespesas,
    },

    /* §2g-i — Patrimônio */
    patrimonio: caso.patrimonio || {},

    /* §2j-l — Situação do endividamento */
    endividamento: {
      montante_total:           analise.totalDividas,
      comprometimento_mensal:   analise.comprometimentoDeclarado,
      perc_comprometido:        analise.percComprometido,
      minimo_existencial:       analise.minimoExistencial,
      n_credores:               analise.nCredores,
      causas:                   caso.causas_endividamento || [],
    },

    /* §2m-o — Cadastros negativos */
    negativacoes: caso.negativacoes || {},

    /* §3 — Mapa de credores */
    credores: analise.credoresCalc.map(c => ({
      ...c,
      /* campos CNJ do formulário original */
      garantia:             (caso.credores_cnj || []).find(x => x.nome === c.nome)?.garantia || '',
      processo_judicial:    (caso.credores_cnj || []).find(x => x.nome === c.nome)?.processo_judicial || false,
      consignado:           (caso.credores_cnj || []).find(x => x.nome === c.nome)?.consignado || false,
      vencida:              (caso.credores_cnj || []).find(x => x.nome === c.nome)?.vencida || false,
      renegociacao:         (caso.credores_cnj || []).find(x => x.nome === c.nome)?.renegociacao || false,
      recebeu_contrato:     (caso.credores_cnj || []).find(x => x.nome === c.nome)?.recebeu_contrato || false,
      informado_juros:      (caso.credores_cnj || []).find(x => x.nome === c.nome)?.informado_juros || false,
      inadimplente_anterior:(caso.credores_cnj || []).find(x => x.nome === c.nome)?.inadimplente_anterior || false,
    })),

    /* Plano de pagamento */
    plano_pagamento: {
      ...analise.plano,
      renda_disponivel: analise.rendaDisponivel,
    },

    /* Análise de conformidade */
    analise: {
      minimo_existencial:     analise.minimoExistencial,
      renda_disponivel:       analise.rendaDisponivel,
      perc_comprometido:      analise.percComprometido,
      total_dividas_corrigidas: analise.totalDividas,
      alertas:                analise.alertas,
    },
  };
}

/* ── LocalStorage autosave ───────────────────────────────────────────────── */

const DRAFT_KEY = 'cnj_draft';

/**
 * Salva rascunho parcial por step.
 * @param {number} step     — índice do step (1–7)
 * @param {Object} data     — dados do step
 * @param {string} [userId] — ID do usuário (para namespacing)
 */
export function saveDraft(step, data, userId) {
  try {
    const key    = userId ? `${DRAFT_KEY}:${userId}` : DRAFT_KEY;
    const stored = JSON.parse(localStorage.getItem(key) || '{}');
    stored[`step${step}`]  = data;
    stored._lastStep       = step;
    stored._savedAt        = new Date().toISOString();
    localStorage.setItem(key, JSON.stringify(stored));
  } catch (_) {}
}

/**
 * Carrega rascunho completo.
 * @param {string} [userId]
 * @returns {Object|null}
 */
export function loadDraft(userId) {
  try {
    const key = userId ? `${DRAFT_KEY}:${userId}` : DRAFT_KEY;
    return JSON.parse(localStorage.getItem(key) || 'null');
  } catch (_) { return null; }
}

/**
 * Limpa rascunho após envio definitivo.
 * @param {string} [userId]
 */
export function clearDraft(userId) {
  try {
    const key = userId ? `${DRAFT_KEY}:${userId}` : DRAFT_KEY;
    localStorage.removeItem(key);
  } catch (_) {}
}
