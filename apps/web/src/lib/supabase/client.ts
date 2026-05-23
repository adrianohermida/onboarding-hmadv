import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

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

function normalizeRestUrl(input: RequestInfo | URL): URL {
  const raw = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  const url = new URL(raw);
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
    const hasRiskyColumns = CASE_SELECT_RISKY_COLUMNS.some((col) => selectParam.includes(col));
    if (selectParam === '*' || hasRiskyColumns) {
      url.searchParams.set('select', CASE_SELECT_FALLBACK);
    }
    url.searchParams.delete('on_conflict');
  }

  return url;
}

function compatibilityFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = normalizeRestUrl(input).toString();
  if (typeof Request !== 'undefined' && input instanceof Request) {
    const req = new Request(url, input);
    return fetch(req, init);
  }
  return fetch(url, init);
}

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: compatibilityFetch,
      },
    },
  );
}
