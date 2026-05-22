import { toFiniteNumber } from '../data-governance/normalizers/CommonNormalizers.js';

export function normalizeCaseData(caso) {
  if (!caso) return null;
  const rendaMensal = toFiniteNumber(caso.renda_mensal ?? caso.renda, 0);
  const rendaFamiliar = toFiniteNumber(caso.renda_familiar, 0);
  const numeroDependentes = toFiniteNumber(caso.numero_dependentes ?? caso.n_dependentes, 0);
  const despesasJson = caso.despesas_json ?? caso.despesas ?? {};

  return {
    ...caso,
    renda_mensal: rendaMensal,
    renda_familiar: rendaFamiliar,
    renda_total: rendaMensal + rendaFamiliar,
    numero_dependentes: numeroDependentes,
    n_dependentes: numeroDependentes,
    despesas_json: typeof despesasJson === 'string' ? despesasJson : JSON.stringify(despesasJson || {}),
    despesas: typeof despesasJson === 'string'
      ? (() => { try { return JSON.parse(despesasJson); } catch (_) { return {}; } })()
      : (despesasJson || {}),
  };
}

function normalizeAdminClientRow(row) {
  if (!row || !row.user_id) return null;
  return {
    user_id: row.user_id,
    email: row.email || null,
    full_name: row.full_name || null,
    cpf: row.cpf || null,
    fase: row.fase || 'cadastro',
    onboarding_done: !!row.onboarding_done,
    cnj_step_atual: row.cnj_step_atual ?? null,
    n_credores: toFiniteNumber(row.n_credores, 0),
    fd_ticket_id: row.fd_ticket_id || null,
    workspace_id: row.workspace_id || null,
    workspace_slug: row.workspace_slug || null,
    total_dividas: toFiniteNumber(row.total_dividas, 0),
    docs_aprovados: toFiniteNumber(row.docs_aprovados, 0),
    docs_pendentes: toFiniteNumber(row.docs_pendentes, 0),
    created_at: row.created_at || null,
    updated_at: row.updated_at || row.created_at || null,
  };
}

export function normalizeAdminClientRows(rows) {
  return (rows || []).map(normalizeAdminClientRow).filter(Boolean);
}
