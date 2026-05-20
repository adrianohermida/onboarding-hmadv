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
export const SUPABASE_URL  = 'https://sspvizogbcyigquqycsz.supabase.co';
export const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzcHZpem9nYmN5aWdxdXF5Y3N6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3OTYxNTYsImV4cCI6MjA4MzM3MjE1Nn0.C1P4wlanONGA9EDNR4nBujJ136sSXlZCioFyd_CWIfs';

export const SITE_URL      = 'https://portal.hermidamaia.adv.br';
export const CALLBACK_PATH = '/pages/auth-callback.html';
export const FUNCTIONS_URL = SUPABASE_URL + '/functions/v1';

export function getCallbackUrl() {
  const origin = window.location.hostname === 'localhost'
    ? window.location.origin
    : SITE_URL;
  return origin + CALLBACK_PATH;
}
