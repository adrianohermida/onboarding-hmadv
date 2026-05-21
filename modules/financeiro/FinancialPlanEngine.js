import { FinancialCalculator, SALARIO_MINIMO_2026 } from './calculator.js';

export const FINANCIAL_PLAN_BASIS = {
  legal: 'Lei 14.181/2021, Recomendacao CNJ 125/2021 e Anexo II CNJ',
  method: 'Matriz operacional Jusfy + planilha Guilherme',
  minimumWage: SALARIO_MINIMO_2026,
};

export const EXPENSE_FIELDS = [
  'moradia',
  'alimentacao',
  'energia',
  'agua',
  'transporte',
  'medicamentos',
  'saude',
  'educacao',
  'dependentes',
  'internet',
  'celular',
  'outros',
];

function toNumber(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

function parseJsonObject(value, fallback = {}) {
  if (!value) return fallback;
  if (typeof value === 'object') return value;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch (_) {
    return fallback;
  }
}

function normalizeDebt(debt = {}) {
  const valor = toNumber(debt.valor || debt.valor_atual || debt.valorDeclarado);
  const parcela = toNumber(debt.parcela_mensal || debt.parcela || debt.valor_parcela);
  const prazo = toNumber(debt.meses_restantes || debt.prazo_meses || debt.parcelas);

  return {
    id: debt.id || debt.numero_contrato || debt.credor || `debt_${Date.now()}`,
    credor: debt.credor || debt.banco || debt.nome || 'Credor',
    tipo: debt.tipo || debt.categoria || 'outro',
    valor,
    parcela_mensal: parcela || (prazo > 0 ? valor / prazo : valor / 36),
    meses_restantes: prazo || null,
    status: debt.status || debt.situacao || 'ativa',
    negativado: Boolean(debt.negativado),
  };
}

function normalizeCase(caso = {}) {
  const despesas = parseJsonObject(caso.despesas || caso.despesas_json, {});
  const rendaMensal = toNumber(caso.renda_mensal || caso.renda || caso.renda_propria);
  const rendaFamiliar = toNumber(caso.renda_familiar);
  const rendaTotal = toNumber(caso.renda_total) || rendaMensal + rendaFamiliar;

  return {
    id: caso.id || null,
    workspace_id: caso.workspace_id || 'hmadv',
    user_id: caso.user_id || null,
    nome: caso.full_name || caso.nome || caso.cliente || 'Cliente',
    renda_mensal: rendaMensal,
    renda_familiar: rendaFamiliar,
    renda_total: rendaTotal,
    dependentes: toNumber(caso.n_dependentes || caso.dependentes || caso.qtd_dependentes),
    despesas,
    plano_pagamento: parseJsonObject(caso.plano_pagamento, null),
  };
}

export class FinancialPlanEngine {
  buildProfile(caso = {}, debts = []) {
    const profile = normalizeCase(caso);
    const dividas = debts.map(normalizeDebt).filter(debt => debt.valor > 0);
    const diagnostico = FinancialCalculator.diagnosticar({
      renda: profile.renda_mensal,
      rendaFamiliar: profile.renda_familiar,
      nDependentes: profile.dependentes,
      despesas: profile.despesas,
      dividas,
    });
    const score = FinancialCalculator.calcularScore(diagnostico);

    return {
      basis: FINANCIAL_PLAN_BASIS,
      profile,
      dividas,
      diagnostico,
      score,
      generatedAt: new Date().toISOString(),
    };
  }

  simulate(profilePayload = {}, options = {}) {
    const totalDividas = toNumber(profilePayload.diagnostico?.totalDividas);
    const capacidade = toNumber(profilePayload.diagnostico?.capacidadePagamento);
    const rendaTotal = toNumber(profilePayload.diagnostico?.rendaTotal);
    const maxRenda = rendaTotal * 0.30;
    const tetoParcela = Math.max(0, Math.min(capacidade, maxRenda || capacidade));
    const prazos = options.prazos || [24, 36, 48, 60, 84];
    const descontos = options.descontos || [0, 0.15, 0.30, 0.45];

    return prazos.flatMap(prazo => descontos.map(desconto => {
      const saldoNegociado = totalDividas * (1 - desconto);
      const parcela = prazo > 0 ? saldoNegociado / prazo : saldoNegociado;
      const sustentavel = tetoParcela > 0 && parcela <= tetoParcela;
      return {
        prazo,
        desconto,
        saldoNegociado: Number(saldoNegociado.toFixed(2)),
        parcela: Number(parcela.toFixed(2)),
        sustentavel,
        folga: Number((tetoParcela - parcela).toFixed(2)),
      };
    })).sort((a, b) => Number(b.sustentavel) - Number(a.sustentavel) || a.parcela - b.parcela);
  }

  buildProposal(profilePayload = {}, options = {}) {
    const simulations = this.simulate(profilePayload, options);
    const recommended = simulations.find(item => item.sustentavel) || simulations[0] || null;
    const diag = profilePayload.diagnostico || {};

    return {
      status: recommended?.sustentavel ? 'proposta_sustentavel' : 'sem_capacidade_segura',
      parcelaSugerida: recommended?.parcela || 0,
      prazoMeses: recommended?.prazo || null,
      descontoReferencia: recommended?.desconto || 0,
      saldoNegociado: recommended?.saldoNegociado || 0,
      minimoPreservado: !diag.violaMinExistencial && toNumber(recommended?.folga) >= 0,
      observacao: recommended?.sustentavel
        ? 'Proposta preserva minimo existencial e respeita teto operacional de comprometimento.'
        : 'Sem parcela segura com os dados atuais. Revisar renda, despesas essenciais e estrategia de audiencia.',
    };
  }

  buildConsolidatedPlan(caso = {}, debts = [], options = {}) {
    const profile = this.buildProfile(caso, debts);
    const simulations = this.simulate(profile, options);
    const proposal = this.buildProposal(profile, options);

    return {
      ...profile,
      simulations,
      proposal,
      exportRows: this.toExportRows(profile, simulations, proposal),
    };
  }

  toExportRows(profilePayload = {}, simulations = [], proposal = {}) {
    const diag = profilePayload.diagnostico || {};
    return [
      ['Base', FINANCIAL_PLAN_BASIS.legal],
      ['Metodo', FINANCIAL_PLAN_BASIS.method],
      ['Renda total', diag.rendaTotal || 0],
      ['Despesas essenciais', diag.despesasEssenciais || 0],
      ['Minimo existencial', diag.minExistencial || 0],
      ['Total de dividas', diag.totalDividas || 0],
      ['Parcelas atuais', diag.parcelaMensalTotal || 0],
      ['Comprometimento', `${diag.comprometimentoPct || 0}%`],
      ['Proposta', proposal.status || 'rascunho'],
      ['Parcela sugerida', proposal.parcelaSugerida || 0],
      ['Prazo', proposal.prazoMeses || 0],
      ['Cenarios simulados', simulations.length],
    ];
  }

  exportCsv(plan = {}) {
    const rows = plan.exportRows || this.toExportRows(plan, plan.simulations || [], plan.proposal || {});
    return rows.map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(';')).join('\n');
  }
}

export const financialPlanEngine = new FinancialPlanEngine();
