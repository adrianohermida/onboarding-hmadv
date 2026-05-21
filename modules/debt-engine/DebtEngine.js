/**
 * DebtEngine — gerencia dívidas com estado local + persistência Supabase
 * Emite eventos via EventBus para sincronizar UI e dashboard financeiro.
 *
 * Eventos emitidos:
 *   debt.loaded       — dívidas carregadas do banco
 *   debt.created      — dívida adicionada
 *   debt.updated      — dívida atualizada
 *   debt.deleted      — dívida removida
 *   debt.list.changed — qualquer alteração na lista (created|updated|deleted)
 */
import { bus } from '../events/EventBus.js';
import { FinancialCalculator } from '../financial/calculator.js';

// Status possíveis de uma dívida
export const DEBT_STATUS = {
  ativa:          { label: 'Ativa',           color: '#dc2626', bg: '#fef2f2' },
  em_negociacao:  { label: 'Em negociação',   color: '#d97706', bg: '#fffbeb' },
  renegociada:    { label: 'Renegociada',     color: '#2E6DA4', bg: '#eff6ff' },
  quitada:        { label: 'Quitada',         color: '#16a34a', bg: '#f0fdf4' },
  prescrita:      { label: 'Prescrita',       color: '#6b7280', bg: '#f9fafb' },
};

// Tipos de credor
export const CREDITOR_TYPES = [
  { value: 'banco',          label: 'Banco / Financeira' },
  { value: 'cartao',         label: 'Cartão de crédito' },
  { value: 'cheque_especial', label: 'Cheque especial' },
  { value: 'emprestimo',     label: 'Empréstimo pessoal' },
  { value: 'financiamento',  label: 'Financiamento (veículo/imóvel)' },
  { value: 'consignado',     label: 'Crédito consignado' },
  { value: 'energia',        label: 'Concessionária de energia' },
  { value: 'agua',           label: 'Companhia de água' },
  { value: 'aluguel',        label: 'Aluguel atrasado' },
  { value: 'saude',          label: 'Plano de saúde / hospital' },
  { value: 'escola',         label: 'Escola / universidade' },
  { value: 'fisco',          label: 'Débito fiscal' },
  { value: 'outro',          label: 'Outro' },
];

export class DebtEngine {
  constructor() {
    this._debts    = [];
    this._loaded   = false;
    this._service  = null; // será injetado via init()
  }

  /**
   * Inicializa com o serviço de banco de dados.
   * @param {object} debtService — objeto com métodos list(), add(), update(), remove()
   */
  async init(debtService) {
    this._service = debtService;
    await this.load();
  }

  // ── CRUD ───────────────────────────────────────────────────────────────────

  async load() {
    try {
      this._debts  = await this._service.list();
      this._loaded = true;
      bus.emit('debt.loaded', { debts: this._debts });
      bus.emit('debt.list.changed', { debts: this._debts });
    } catch (e) {
      console.error('[DebtEngine] load error:', e);
      this._debts = [];
    }
    return this._debts;
  }

  async add(debtData) {
    const debt = await this._service.add(this._normalise(debtData));
    this._debts.push(debt);
    bus.emit('debt.created',      { debt });
    bus.emit('debt.list.changed', { debts: this._debts });
    return debt;
  }

  async update(id, fields) {
    if (!this._service.update) {
      // fallback: remove + re-add (for services without update method)
      await this._service.remove(id);
      const updated = await this._service.add({ ...this._findById(id), ...fields });
      this._debts = this._debts.filter(d => d.id !== id);
      this._debts.push(updated);
      bus.emit('debt.updated',      { debt: updated });
      bus.emit('debt.list.changed', { debts: this._debts });
      return updated;
    }
    const updated = await this._service.update(id, fields);
    this._debts = this._debts.map(d => d.id === id ? { ...d, ...updated } : d);
    bus.emit('debt.updated',      { debt: updated });
    bus.emit('debt.list.changed', { debts: this._debts });
    return updated;
  }

  async remove(id) {
    await this._service.remove(id);
    const removed = this._findById(id);
    this._debts = this._debts.filter(d => d.id !== id);
    bus.emit('debt.deleted',      { id, debt: removed });
    bus.emit('debt.list.changed', { debts: this._debts });
  }

  // ── Computed ───────────────────────────────────────────────────────────────

  getAll()       { return this._debts; }
  getActive()    { return this._debts.filter(d => d.status !== 'quitada' && d.status !== 'prescrita'); }
  getCount()     { return this._debts.length; }
  getActiveCount() { return this.getActive().length; }

  getTotalValue() {
    return FinancialCalculator.calcularTotalDividas(this._debts);
  }

  getTotalActiveValue() {
    return FinancialCalculator.calcularTotalDividas(this.getActive());
  }

  getMonthlyInstallments() {
    return FinancialCalculator.calcularParcelaMensalTotal(this.getActive());
  }

  /** Agrupa dívidas por tipo de credor */
  groupByType() {
    const groups = {};
    for (const d of this._debts) {
      const key = d.tipo || 'outro';
      if (!groups[key]) groups[key] = { total: 0, count: 0, debts: [] };
      groups[key].total += Number(d.valor) || 0;
      groups[key].count++;
      groups[key].debts.push(d);
    }
    return groups;
  }

  /** Agrupa dívidas por status */
  groupByStatus() {
    const groups = {};
    for (const d of this._debts) {
      const key = d.status || 'ativa';
      if (!groups[key]) groups[key] = { total: 0, count: 0 };
      groups[key].total += Number(d.valor) || 0;
      groups[key].count++;
    }
    return groups;
  }

  /** Diagnóstico financeiro completo usando FinancialCalculator */
  getDiagnostico(rendaBruta = 0, despesas = {}, nDependentes = 0) {
    return FinancialCalculator.diagnosticar({
      renda:        rendaBruta,
      nDependentes,
      despesas,
      dividas:      this.getActive(),
    });
  }

  /** Score de criticidade 0-100 */
  getScore(rendaBruta = 0, despesas = {}, nDependentes = 0) {
    const diagnostico = this.getDiagnostico(rendaBruta, despesas, nDependentes);
    return FinancialCalculator.calcularScore(diagnostico);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  _findById(id) { return this._debts.find(d => d.id === id); }

  _normalise(data) {
    return {
      credor:            data.credor          ?? '',
      tipo:              data.tipo            ?? 'outro',
      valor:             Number(data.valor)   || 0,
      parcela_mensal:    Number(data.parcela_mensal) || 0,
      meses_restantes:   Number(data.meses_restantes) || null,
      taxa_juros_mensal: Number(data.taxa_juros_mensal) || 0,
      status:            data.status          ?? 'ativa',
      negativado:        data.negativado      ?? false,
      banco:             data.banco           ?? null,
      numero_contrato:   data.numero_contrato ?? null,
      data_vencimento:   data.data_vencimento ?? null,
      observacoes:       data.observacoes     ?? null,
    };
  }
}
