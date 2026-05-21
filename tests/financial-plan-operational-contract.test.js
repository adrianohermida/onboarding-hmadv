import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { financialPlanEngine, FINANCIAL_PLAN_BASIS } from '../modules/financeiro/FinancialPlanEngine.js';
import { SALARIO_MINIMO_2026 } from '../modules/financeiro/calculator.js';

const root = process.cwd();

function readFile(...parts) {
  return fs.readFileSync(path.join(root, ...parts), 'utf8');
}

describe('financial plan operational contract', () => {
  it('builds a consolidated CNJ payment plan with minimum existential protection', () => {
    const plan = financialPlanEngine.buildConsolidatedPlan(
      {
        renda_mensal: 5000,
        renda_familiar: 800,
        dependentes: 1,
        despesas: { moradia: 1200, alimentacao: 900, transporte: 350 },
      },
      [
        { credor: 'Banco A', valor: 28000, parcela_mensal: 1700 },
        { credor: 'Cartao B', valor: 14000, parcela_mensal: 900 },
      ],
    );

    expect(FINANCIAL_PLAN_BASIS.legal).toContain('Anexo II CNJ');
    expect(FINANCIAL_PLAN_BASIS.method).toContain('Jusfy');
    expect(FINANCIAL_PLAN_BASIS.method).toContain('Guilherme');
    expect(SALARIO_MINIMO_2026).toBeGreaterThan(1500);
    expect(plan.diagnostico.rendaTotal).toBe(5800);
    expect(plan.diagnostico.minExistencial).toBeGreaterThan(1600);
    expect(plan.simulations.length).toBeGreaterThanOrEqual(10);
    expect(plan.proposal).toHaveProperty('parcelaSugerida');
    expect(plan.exportRows.some(row => row[0] === 'Comprometimento')).toBe(true);
    expect(financialPlanEngine.exportCsv(plan)).toContain('Parcela sugerida');
  });

  it('wires client plan and lawyer finance modules to the financial engine', () => {
    const cliente = readFile('modules', 'cliente', 'PortalClientePage.js');
    const advogado = readFile('modules', 'advogado', 'PortalAdvogadoPage.js');
    const config = readFile('modules', 'advogado', 'RegistroAdvogadoService.js');
    const styles = readFile('styles', 'components.css');

    expect(cliente).toContain('financialPlanEngine.buildConsolidatedPlan');
    expect(cliente).toContain('cliente-plan-scenarios');
    expect(advogado).toContain('data-financial-simulator');
    expect(advogado).toContain('data-financial-export');
    expect(config).toContain('parcela_sugerida');
    expect(config).toContain('comprometimento');
    expect(styles).toContain('.financial-simulator');
    expect(styles).toContain('.cliente-plan-summary');
  });
});
