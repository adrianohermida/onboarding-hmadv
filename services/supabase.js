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
    if (url.searchParams.get('select') === '*') {
      url.searchParams.set('select', CASE_SELECT_FALLBACK);
    }
    url.searchParams.delete('on_conflict');
  }

  return url;
}

async function compatibilityFetch(input, init = {}) {
  const url = normalizeRestUrl(input);
  if (typeof Request !== 'undefined' && input instanceof Request) {
    const req = new Request(url.toString(), input);
    return fetch(req, init);
  }
  return fetch(url.toString(), init);
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
