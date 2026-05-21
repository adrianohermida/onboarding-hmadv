import { describe, expect, it } from 'vitest';
import { normalizeCaseData } from '../services/data-contracts.js';
import { toFriendlyMessage } from '../services/error-messages.js';

describe('phase 3 data contracts', () => {
  it('normalizes legacy and current renda fields into renda_total', () => {
    const normalized = normalizeCaseData({
      renda: '1200.5',
      renda_familiar: '800',
      n_dependentes: '2',
      despesas: { aluguel: 500 },
    });

    expect(normalized.renda_mensal).toBe(1200.5);
    expect(normalized.renda_familiar).toBe(800);
    expect(normalized.renda_total).toBe(2000.5);
    expect(normalized.numero_dependentes).toBe(2);
    expect(normalized.n_dependentes).toBe(2);
  });

  it('parses despesas_json and degrades gracefully on invalid JSON', () => {
    const ok = normalizeCaseData({ despesas_json: '{"agua":120}' });
    const bad = normalizeCaseData({ despesas_json: '{invalid-json}' });

    expect(ok.despesas).toEqual({ agua: 120 });
    expect(bad.despesas).toEqual({});
  });
});

describe('phase 3 friendly errors', () => {
  it('maps session and timeout errors to user-friendly texts', () => {
    expect(toFriendlyMessage(new Error('Sessao expirada no token')))
      .toBe('Sessao expirada. Faca login novamente.');
    expect(toFriendlyMessage(new Error('request timeout reached')))
      .toBe('A requisicao demorou mais do que o esperado. Tente novamente.');
  });

  it('returns fallback for unknown errors', () => {
    expect(toFriendlyMessage(new Error('xpto'), 'Falha personalizada'))
      .toBe('Falha personalizada');
  });
});
