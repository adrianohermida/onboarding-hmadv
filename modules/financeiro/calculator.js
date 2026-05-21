/**
 * FinancialCalculator — Motor de cálculo financeiro
 * Base legal: Lei 14.181/2021 + Recomendação CNJ 125/2021
 *
 * Conceitos:
 *   - Mínimo Existencial: piso intocável para dignidade humana
 *   - Superendividamento: comprometimento > 70% da renda disponível
 *   - Renda disponível: renda - despesas essenciais (não inclui dívidas)
 *   - Capacidade de pagamento: renda disponível - mínimo existencial
 */

// Salario minimo federal vigente em 2026 (Decreto 12.797/2025).
const SALARIO_MINIMO_2026 = 1_621.00;

// Limite de comprometimento para configurar superendividamento (art. 54-A CDC)
const LIMITE_SUPERENDIVIDAMENTO = 0.70; // 70%

// Categorias de despesa essencial (mínimo existencial)
export const DESPESAS_ESSENCIAIS_KEYS = [
  'moradia', 'alimentacao', 'energia', 'agua', 'transporte',
  'medicamentos', 'saude', 'educacao', 'dependentes',
];

// Categorias de despesa variável
export const DESPESAS_VARIAVEIS_KEYS = [
  'internet', 'celular', 'streaming', 'lazer', 'vestuario', 'outros',
];

export const DESPESAS_CONFIG = {
  moradia:      { label: 'Moradia (aluguel/prestacao)',  icon: 'MOR', essencial: true },
  alimentacao:  { label: 'Alimentacao',                  icon: 'ALI', essencial: true },
  energia:      { label: 'Energia eletrica',             icon: 'ENE', essencial: true },
  agua:         { label: 'Agua e saneamento',            icon: 'AGU', essencial: true },
  transporte:   { label: 'Transporte',                   icon: 'TRN', essencial: true },
  medicamentos: { label: 'Medicamentos',                 icon: 'MED', essencial: true },
  saude:        { label: 'Plano de saude',               icon: 'SAU', essencial: true },
  educacao:     { label: 'Educacao / escola',            icon: 'EDU', essencial: true },
  dependentes:  { label: 'Pensao / dependentes',         icon: 'DEP', essencial: true },
  internet:     { label: 'Internet / telefone',          icon: 'INT', essencial: false },
  celular:      { label: 'Celular pre-pago',             icon: 'CEL', essencial: false },
  streaming:    { label: 'Streaming / assinaturas',      icon: 'STR', essencial: false },
  lazer:        { label: 'Lazer',                        icon: 'LZR', essencial: false },
  vestuario:    { label: 'Vestuario',                    icon: 'VST', essencial: false },
  outros:       { label: 'Outras despesas',              icon: 'OUT', essencial: false },
};

export class FinancialCalculator {

  // ── Mínimo Existencial ──────────────────────────────────────────────────────
  /**
   * Calcula o mínimo existencial conforme Lei 14.181/2021.
   * Fórmula: 1 SM + 30% por dependente.
   * @param {number} nDependentes
   * @param {number} [salarioMinimo] - usa valor corrente se omitido
   */
  static calcularMinExistencial(nDependentes = 0, salarioMinimo = SALARIO_MINIMO_2026) {
    return salarioMinimo + (nDependentes * salarioMinimo * 0.30);
  }

  // ── Renda ───────────────────────────────────────────────────────────────────
  /**
   * Soma das despesas essenciais a partir do objeto de despesas.
   * @param {Object} despesas  { moradia: 800, alimentacao: 600, ... }
   */
  static somarDespesasEssenciais(despesas = {}) {
    return DESPESAS_ESSENCIAIS_KEYS.reduce((acc, k) => acc + (Number(despesas[k]) || 0), 0);
  }

  static somarDespesasVariaveis(despesas = {}) {
    return DESPESAS_VARIAVEIS_KEYS.reduce((acc, k) => acc + (Number(despesas[k]) || 0), 0);
  }

  static somarTodasDespesas(despesas = {}) {
    return this.somarDespesasEssenciais(despesas) + this.somarDespesasVariaveis(despesas);
  }

  /**
   * Renda disponível = renda bruta − despesas essenciais
   * (Não deduz dívidas — dívidas são o problema, não uma despesa legítima)
   */
  static calcularRendaDisponivel(rendaBruta, despesas = {}) {
    return rendaBruta - this.somarDespesasEssenciais(despesas);
  }

  /**
   * Capacidade máxima de pagamento mensal de dívidas
   * = renda disponível − mínimo existencial
   */
  static calcularCapacidadePagamento(rendaBruta, despesas = {}, nDependentes = 0) {
    const rendaDisp = this.calcularRendaDisponivel(rendaBruta, despesas);
    const minEx     = this.calcularMinExistencial(nDependentes);
    return Math.max(0, rendaDisp - minEx);
  }

  // ── Comprometimento ─────────────────────────────────────────────────────────
  /**
   * Percentual de comprometimento de renda com dívidas.
   * @param {number} totalParcelasMensais - soma de todas as parcelas mensais
   * @param {number} rendaBruta
   */
  static calcularComprometimentoPct(totalParcelasMensais, rendaBruta) {
    if (!rendaBruta || rendaBruta <= 0) return 100;
    return Math.min(100, (totalParcelasMensais / rendaBruta) * 100);
  }

  /**
   * Valor absoluto comprometido com dívidas por mês
   */
  static calcularParcelaMensalTotal(dividas = []) {
    return dividas.reduce((acc, d) => acc + (Number(d.parcela_mensal) || Number(d.valor) / 12 || 0), 0);
  }

  static calcularTotalDividas(dividas = []) {
    return dividas.reduce((acc, d) => acc + (Number(d.valor) || 0), 0);
  }

  // ── Diagnóstico Principal ───────────────────────────────────────────────────
  /**
   * Diagnóstico financeiro completo.
   * @param {Object} dados
   * @param {number}   dados.renda
   * @param {number}   [dados.rendaFamiliar]
   * @param {number}   [dados.nDependentes]
   * @param {Object}   [dados.despesas]
   * @param {Array}    [dados.dividas]
   */
  static diagnosticar(dados = {}) {
    const {
      renda            = 0,
      rendaFamiliar    = 0,
      nDependentes     = 0,
      despesas         = {},
      dividas          = [],
    } = dados;

    const rendaTotal          = renda + rendaFamiliar;
    const despesasEssenciais  = this.somarDespesasEssenciais(despesas);
    const despesasVariaveis   = this.somarDespesasVariaveis(despesas);
    const totalDespesas       = despesasEssenciais + despesasVariaveis;
    const totalDividas        = this.calcularTotalDividas(dividas);
    const parcelaMensalTotal  = this.calcularParcelaMensalTotal(dividas);
    const minExistencial      = this.calcularMinExistencial(nDependentes);
    const rendaDisponivel     = this.calcularRendaDisponivel(rendaTotal, despesas);
    const capacidadePagamento = this.calcularCapacidadePagamento(rendaTotal, despesas, nDependentes);
    const comprometimentoPct  = this.calcularComprometimentoPct(parcelaMensalTotal, rendaTotal);
    const sobraReal           = rendaDisponivel - parcelaMensalTotal - minExistencial;

    // Diagnóstico de superendividamento
    const isSuperendividado = comprometimentoPct > 70 || sobraReal < 0;
    const deficit           = Math.max(0, parcelaMensalTotal - capacidadePagamento);

    // Severidade
    let severity;
    if (comprometimentoPct >= 90 || sobraReal < -minExistencial) severity = 'critical';
    else if (comprometimentoPct >= 70 || sobraReal < 0)          severity = 'high';
    else if (comprometimentoPct >= 50)                           severity = 'medium';
    else                                                         severity = 'low';

    // Alerta de mínimo existencial
    const violaMinExistencial = (rendaDisponivel - parcelaMensalTotal) < minExistencial;

    return {
      // Entradas
      rendaTotal, nDependentes, despesasEssenciais, despesasVariaveis,
      totalDespesas, totalDividas, parcelaMensalTotal,
      // Cálculos
      minExistencial, rendaDisponivel, capacidadePagamento,
      comprometimentoPct: Number(comprometimentoPct.toFixed(1)),
      sobraReal,
      deficit,
      // Diagnóstico
      isSuperendividado,
      severity,
      violaMinExistencial,
      // Plano sugerido de pagamento
      planoSugerido: capacidadePagamento > 0 ? {
        parcelaSugerida:   Number(capacidadePagamento.toFixed(2)),
        prazoMesesEstimado: capacidadePagamento > 0
          ? Math.ceil(totalDividas / capacidadePagamento)
          : null,
      } : null,
    };
  }

  // ── Score de criticidade ────────────────────────────────────────────────────
  /**
   * Score 0–100 onde 100 = situação mais crítica.
   * Composto de 4 dimensões.
   */
  static calcularScore(diagnostico) {
    if (!diagnostico) return 0;
    const { comprometimentoPct, violaMinExistencial, totalDividas, rendaTotal } = diagnostico;

    // Dimensão 1: comprometimento de renda (0-40 pts)
    const d1 = Math.min(40, (comprometimentoPct / 100) * 40);

    // Dimensão 2: violação do mínimo existencial (0-30 pts)
    const d2 = violaMinExistencial ? 30 : 0;

    // Dimensão 3: relação dívida/renda anual (0-20 pts)
    const ratioAnual = rendaTotal > 0 ? (totalDividas / (rendaTotal * 12)) : 1;
    const d3 = Math.min(20, ratioAnual * 10);

    // Dimensão 4: severidade do diagnóstico (0-10 pts)
    const d4 = { critical: 10, high: 7, medium: 4, low: 1 }[diagnostico.severity] ?? 0;

    return Math.round(d1 + d2 + d3 + d4);
  }

  // ── Formatação ──────────────────────────────────────────────────────────────
  static formatBRL(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  }

  static formatPct(value) {
    return `${Number(value || 0).toFixed(1)}%`;
  }

  static getSeverityLabel(severity) {
    return { critical: 'Crítico', high: 'Alto', medium: 'Médio', low: 'Baixo' }[severity] ?? '—';
  }

  static getSeverityColor(severity) {
    return { critical: '#dc2626', high: '#ea580c', medium: '#d97706', low: '#16a34a' }[severity] ?? '#6b7280';
  }
}

export { SALARIO_MINIMO_2026 };
export const SALARIO_MINIMO_2024 = SALARIO_MINIMO_2026;
