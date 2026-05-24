/**
 * config.js — Configurações globais da aplicação.
 *
 * Para habilitar autenticação:
 * 1. Acesse https://supabase.com/dashboard
 * 2. Crie ou use um projeto existente
 * 3. Em Authentication > Providers > Email, habilite "Enable Email Signup" e "Magic Link"
 * 4. Em Authentication > URL Configuration, adicione o site URL: https://portal.hermidamaia.adv.br
 * 5. Substitua os valores abaixo com as credenciais do seu projeto
 */
const DEFAULT_SUPABASE_URL = 'https://sspvizogbcyigquqycsz.supabase.co';

function readStorageValue(key) {
  try {
    if (typeof localStorage === 'undefined') return null;
    const value = localStorage.getItem(key);
    return value && String(value).trim() ? String(value).trim() : null;
  } catch (_) {
    return null;
  }
}

function readRuntimeSupabaseConfig() {
  const injected = (typeof window !== 'undefined' && window.__HM_SUPABASE__) || {};
  const url =
    injected.defaultUrl ||
    readStorageValue('SUPABASE_URL') ||
    readStorageValue('NEXT_PUBLIC_SUPABASE_URL') ||
    DEFAULT_SUPABASE_URL;

  const anon =
    injected.defaultKey ||
    readStorageValue('SUPABASE_ANON_KEY') ||
    readStorageValue('NEXT_PUBLIC_SUPABASE_ANON_KEY') ||
    '';

  return { url, anon };
}

const runtimeSupabase = readRuntimeSupabaseConfig();

export const SUPABASE_URL  = runtimeSupabase.url;
export const SUPABASE_ANON = runtimeSupabase.anon;

export const SITE_URL      = 'https://portal.hermidamaia.adv.br';
export const CALLBACK_PATH = '/pages/auth-callback.html';
export const FUNCTIONS_URL = SUPABASE_URL + '/functions/v1';

export function getCallbackUrl() {
  const origin = window.location.hostname === 'localhost'
    ? window.location.origin
    : SITE_URL;
  return origin + CALLBACK_PATH;
}
