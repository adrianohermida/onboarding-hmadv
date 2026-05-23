import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_ANON } from '../utils/config.js';

const CASE_SELECT_FALLBACK = [
  'id',
  'user_id',
  'workspace_id',
  'full_name',
  'fase',
  'onboarding_done',
  'numero_processo',
  'cnj_step_atual',
  'created_at',
  'updated_at',
].join(',');

const CASE_SELECT_RISKY_COLUMNS = [
  'renda_mensal',
  'renda',
  'renda_familiar',
  'numero_dependentes',
  'n_dependentes',
  'despesas_json',
  'despesas',
  'credores_cnj',
  'onboarding_done',
  'cnj_step_atual',
];

const OPTIONAL_OPERATIONAL_TABLES = new Set([
  'portal_operational_records',
  'portal_operational_record_audit',
  'portal_partes_vinculos',
  'custas_processuais',
  'tpu',
  'orgaos_judiciarios',
  'serventias',
  'relacoes_processuais',
]);
const OPTIONAL_MISSING_TABLES_STORAGE_KEY = 'portal:optional-missing-rest-tables';
const OPTIONAL_SCHEMA_MISSING_STORAGE_KEY = 'portal:optional-rest-schema-missing';

function readMissingOptionalTables() {
  try {
    const raw = localStorage.getItem(OPTIONAL_MISSING_TABLES_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

const missingOptionalTables = new Set(readMissingOptionalTables());

if (missingOptionalTables.has('portal_operational_records')) {
  try {
    localStorage.setItem(OPTIONAL_SCHEMA_MISSING_STORAGE_KEY, '1');
  } catch (_) {}
}

function isOptionalSchemaMarkedMissing() {
  try {
    return localStorage.getItem(OPTIONAL_SCHEMA_MISSING_STORAGE_KEY) === '1';
  } catch (_) {
    return false;
  }
}

function getOptionalOperationalTable(url) {
  if (!url.pathname.includes('/rest/v1/')) return '';
  const table = url.pathname.split('/').pop() || '';
  return OPTIONAL_OPERATIONAL_TABLES.has(table) ? table : '';
}

function persistMissingOptionalTables() {
  try {
    localStorage.setItem(
      OPTIONAL_MISSING_TABLES_STORAGE_KEY,
      JSON.stringify(Array.from(missingOptionalTables)),
    );
  } catch (_) {}
}

function markOptionalTableAsMissing(url) {
  const table = getOptionalOperationalTable(url);
  if (!table || missingOptionalTables.has(table)) return;
  missingOptionalTables.add(table);
  persistMissingOptionalTables();
  try {
    localStorage.setItem(OPTIONAL_SCHEMA_MISSING_STORAGE_KEY, '1');
  } catch (_) {}
}

function isKnownMissingOptionalTable(url) {
  const table = getOptionalOperationalTable(url);
  return !!table && (missingOptionalTables.has(table) || isOptionalSchemaMarkedMissing());
}

function shouldBypassOptionalRestRequest(url, method) {
  if (method !== 'GET' || !isOptionalOperationalRestRequest(url)) return false;
  if (window.location.protocol === 'file:') return true;
  return isKnownMissingOptionalTable(url);
}

function isOptionalOperationalRestRequest(url) {
  return !!getOptionalOperationalTable(url);
}

function emptyListResponse() {
  return new Response('[]', {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'x-compat-fallback': 'optional-table-404-as-empty-list',
    },
  });
}

function normalizeRestUrl(input) {
  const url = new URL(typeof input === 'string' ? input : input.url);
  const table = url.pathname.split('/').pop() || '';

  if (table === 'portal_custas') {
    url.searchParams.delete('deleted_at');
    if (url.searchParams.get('order')?.includes('data_lancamento')) {
      url.searchParams.set('order', 'created_at.desc');
    }
  }

  if (table === 'portal_contratos') {
    url.searchParams.delete('deleted_at');
    if (url.searchParams.get('order') === 'updated_at.desc') {
      url.searchParams.set('order', 'created_at.desc');
    }
  }

  if (table === 'portal_casos') {
    const selectParam = url.searchParams.get('select') || '';
    const hasRiskyColumns = CASE_SELECT_RISKY_COLUMNS.some(col => selectParam.includes(col));
    if (selectParam === '*' || hasRiskyColumns) {
      url.searchParams.set('select', CASE_SELECT_FALLBACK);
    }
    url.searchParams.delete('on_conflict');
  }

  return url;
}

async function compatibilityFetch(input, init = {}) {
  const url = normalizeRestUrl(input);
  const method = String((init && init.method) || (input instanceof Request ? input.method : 'GET')).toUpperCase();

  if (shouldBypassOptionalRestRequest(url, method)) {
    return emptyListResponse();
  }

  if (typeof Request !== 'undefined' && input instanceof Request) {
    const req = new Request(url.toString(), input);
    const response = await fetch(req, init);
    if (response.status === 404 && method === 'GET' && isOptionalOperationalRestRequest(url)) {
      markOptionalTableAsMissing(url);
      return emptyListResponse();
    }
    return response;
  }

  const response = await fetch(url.toString(), init);
  if (response.status === 404 && method === 'GET' && isOptionalOperationalRestRequest(url)) {
    markOptionalTableAsMissing(url);
    return emptyListResponse();
  }
  return response;
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    persistSession:    true,
    autoRefreshToken:  true,
    detectSessionInUrl: true,
    storageKey: 'hm_portal_auth',
  },
  global: {
    fetch: compatibilityFetch,
  },
});
