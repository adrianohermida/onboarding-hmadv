import { describe, expect, it } from 'vitest';
import {
  buildCaseContextHref,
  buildCaseContextQuery,
  clampCnjStep,
  formatCaseFlowDate,
  getCaseFlowSummary,
} from '../js/case-flow.js';

describe('case flow helpers', () => {
  it('clamps CNJ steps to the supported range', () => {
    expect(clampCnjStep(-1)).toBe(0);
    expect(clampCnjStep(3)).toBe(3);
    expect(clampCnjStep(12)).toBe(7);
  });

  it('builds context-aware query strings and hrefs', () => {
    expect(buildCaseContextQuery({ source: 'journey', clientId: 'abc', formulario: 'concluido' }))
      .toBe('source=journey&client=abc&formulario=concluido');
    expect(buildCaseContextHref('onboarding', { source: 'journey', clientId: 'abc' }))
      .toBe('onboarding.html?source=journey&client=abc');
  });

  it('summarizes not-started, in-progress and completed cases', () => {
    expect(getCaseFlowSummary({}).key).toBe('not_started');
    expect(getCaseFlowSummary({ cnj_step_atual: 4 }).progressPct).toBe(57);
    expect(getCaseFlowSummary({ onboarding_done: true }, { workflowStatus: 'aprovado' }).label).toBe('Aprovado');
  });

  it('formats dates for pt-BR consumers', () => {
    expect(formatCaseFlowDate('2026-05-20T10:00:00.000Z')).toMatch(/20\/05\/2026/);
  });
});