/**
 * Authentication BFF for portal login.
 * Frontend never calls Supabase directly; all auth flows go through this route.
 */

import type { Env } from '../env.d';
import { getSiteUrl, getSupabaseAnonKey, getSupabaseBaseUrl, getSupabaseServiceKey } from '../lib/env';
import { jsonError, jsonOk, methodNotAllowed } from '../lib/response';

type JsonMap = Record<string, unknown>;

type SessionPayload = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  user?: JsonMap | null;
};

const ACCESS_COOKIE = 'hm_at';
const REFRESH_COOKIE = 'hm_rt';
const ADMIN_OTP_COOKIE = 'hm_admin_otp';
const AUTH_BASE = '/auth/v1';

function getAdminOtpEmail(env: Env): string {
  const value = String((env as any).HM_ADMIN_OTP_EMAIL || 'adrianohermida@gmail.com').trim().toLowerCase();
  return value || 'adrianohermida@gmail.com';
}

function getAdminOtpCode(env: Env): string {
  return String((env as any).HM_ADMIN_OTP_CODE || '172145').trim();
}

function isAdminOtpUser(env: Env, email: string, token: string): boolean {
  return String(email || '').trim().toLowerCase() === getAdminOtpEmail(env) && String(token || '').trim() === getAdminOtpCode(env);
}

function buildAdminOtpPayload(env: Env): JsonMap {
  const email = getAdminOtpEmail(env);
  return {
    ok: true,
    authenticated: true,
    user: {
      id: 'hm_admin_otp',
      email,
      role: 'admin',
      app_metadata: {
        role: 'admin',
        tenant_id: 'hmadv',
      },
      user_metadata: {
        tenant_id: 'hmadv',
      },
    },
    session: {
      expires_in: null,
      token_type: 'otp-admin',
    },
    role: 'admin',
  };
}

function allowedOrigin(origin: string): boolean {
  if (!origin) return false;
  if (origin === 'https://hermidamaia.adv.br') return true;
  if (origin === 'https://www.hermidamaia.adv.br') return true;
  if (origin === 'https://portal.hermidamaia.adv.br') return true;
  if (origin === 'https://api.hermidamaia.adv.br') return true;
  if (origin.endsWith('.hermidamaia.adv.br')) return true;
  if (origin.startsWith('http://localhost:')) return true;
  if (origin.startsWith('http://127.0.0.1:')) return true;
  return false;
}

function corsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('Origin') || '';
  const safeOrigin = allowedOrigin(origin) ? origin : 'https://portal.hermidamaia.adv.br';
  return {
    'Access-Control-Allow-Origin': safeOrigin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    Vary: 'Origin',
  };
}

function withCors(response: Response, request: Request): Response {
  const headers = new Headers(response.headers);
  const cors = corsHeaders(request);
  Object.entries(cors).forEach(([key, value]) => headers.set(key, value));
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function jsonWithCors(request: Request, payload: unknown, status = 200): Response {
  const response = new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
  return withCors(response, request);
}

function readCookies(request: Request): Record<string, string> {
  const raw = request.headers.get('cookie') || '';
  return raw
    .split(';')
    .map(part => part.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, item) => {
      const idx = item.indexOf('=');
      if (idx < 0) return acc;
      const key = item.slice(0, idx).trim();
      const value = item.slice(idx + 1).trim();
      if (key) acc[key] = decodeURIComponent(value || '');
      return acc;
    }, {});
}

function isProdLike(request: Request): boolean {
  const host = new URL(request.url).hostname.toLowerCase();
  return host !== 'localhost' && host !== '127.0.0.1';
}

function buildCookie(
  request: Request,
  name: string,
  value: string,
  maxAgeSeconds: number,
  clear = false
): string {
  const secure = isProdLike(request);
  const attrs = [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${clear ? 0 : Math.max(1, maxAgeSeconds)}`,
  ];
  if (secure) attrs.push('Secure');
  return attrs.join('; ');
}

function setSessionCookies(request: Request, response: Response, session: SessionPayload): Response {
  const headers = new Headers(response.headers);
  const accessToken = String(session.access_token || '').trim();
  const refreshToken = String(session.refresh_token || '').trim();
  if (accessToken) {
    headers.append('Set-Cookie', buildCookie(request, ACCESS_COOKIE, accessToken, Number(session.expires_in || 3600)));
  }
  if (refreshToken) {
    headers.append('Set-Cookie', buildCookie(request, REFRESH_COOKIE, refreshToken, 60 * 60 * 24 * 30));
  }
  headers.append('Set-Cookie', buildCookie(request, ADMIN_OTP_COOKIE, '', 0, true));
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function clearSessionCookies(request: Request, response: Response): Response {
  const headers = new Headers(response.headers);
  headers.append('Set-Cookie', buildCookie(request, ACCESS_COOKIE, '', 0, true));
  headers.append('Set-Cookie', buildCookie(request, REFRESH_COOKIE, '', 0, true));
  headers.append('Set-Cookie', buildCookie(request, ADMIN_OTP_COOKIE, '', 0, true));
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function setAdminOtpCookie(request: Request, response: Response, env: Env): Response {
  const headers = new Headers(response.headers);
  headers.append('Set-Cookie', buildCookie(request, ADMIN_OTP_COOKIE, getAdminOtpEmail(env), 60 * 60 * 8));
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function parseJsonBody(request: Request): Promise<JsonMap> {
  try {
    const data = await request.json();
    if (!data || typeof data !== 'object') return {};
    return data as JsonMap;
  } catch (_) {
    return {};
  }
}

async function supabaseAuthFetch(
  env: Env,
  request: Request,
  endpoint: string,
  init: RequestInit,
  token?: string
): Promise<{ ok: boolean; status: number; body: JsonMap }> {
  const baseUrl = getSupabaseBaseUrl(env);
  const anonKey = getSupabaseAnonKey(env);
  if (!baseUrl || !anonKey) {
    return {
      ok: false,
      status: 500,
      body: { error: 'Configuração de autenticação indisponível no servidor.' },
    };
  }

  const headers = new Headers(init.headers || {});
  headers.set('Content-Type', 'application/json');
  headers.set('apikey', anonKey);
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${baseUrl}${AUTH_BASE}${endpoint}`, {
    ...init,
    headers,
  });

  let body: JsonMap = {};
  try {
    body = await response.json();
  } catch (_) {
    body = {};
  }

  if (response.status === 401 && endpoint.startsWith('/user')) {
    const cookies = readCookies(request);
    const refreshToken = cookies[REFRESH_COOKIE];
    if (refreshToken) {
      const refreshed = await fetch(`${baseUrl}${AUTH_BASE}/token?grant_type=refresh_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: anonKey,
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (refreshed.ok) {
        let refreshedBody: JsonMap = {};
        try {
          refreshedBody = await refreshed.json();
        } catch (_) {
          refreshedBody = {};
        }
        return { ok: true, status: refreshed.status, body: refreshedBody };
      }
    }
  }

  return { ok: response.ok, status: response.status, body };
}

async function resolveAdminRole(env: Env, userId: string): Promise<string | null> {
  const baseUrl = getSupabaseBaseUrl(env);
  const serviceKey = getSupabaseServiceKey(env);
  if (!baseUrl || !serviceKey || !userId) return null;

  const url = new URL(`${baseUrl}/rest/v1/admin_users`);
  url.searchParams.set('select', 'role');
  url.searchParams.set('user_id', `eq.${userId}`);
  url.searchParams.set('limit', '1');

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    });
    if (!response.ok) return null;

    const data = (await response.json()) as Array<{ role?: string }>;
    return data?.[0]?.role || null;
  } catch (_) {
    return null;
  }
}

async function buildSessionEnvelope(env: Env, sessionLike: JsonMap): Promise<JsonMap> {
  const user = (sessionLike.user || null) as JsonMap | null;
  const userId = String((user && user.id) || '');
  const role = userId ? await resolveAdminRole(env, userId) : null;

  return {
    ok: true,
    authenticated: Boolean(user),
    user,
    session: {
      expires_in: Number(sessionLike.expires_in || 0) || null,
      token_type: String(sessionLike.token_type || ''),
    },
    role,
  };
}

function getCallbackUrl(env: Env): string {
  const siteUrl = getSiteUrl(env).replace(/\/$/, '');
  return `${siteUrl}/pages/auth-callback.html`;
}

function mapAuthErrorMessage(raw: unknown): string {
  const message = String((raw as JsonMap)?.msg || (raw as JsonMap)?.error_description || (raw as JsonMap)?.message || (raw as JsonMap)?.error || '').trim();
  if (!message) return 'Falha na autenticação.';

  const lower = message.toLowerCase();
  if (lower.includes('invalid login credentials')) return 'E-mail ou senha inválidos.';
  if (lower.includes('email not confirmed')) return 'E-mail não confirmado. Verifique sua caixa de entrada.';
  if (lower.includes('invalid api key') || lower.includes('jwt')) return 'Serviço de autenticação indisponível.';
  return message;
}

async function getSessionFromCookies(env: Env, request: Request): Promise<JsonMap | null> {
  const cookies = readCookies(request);
  const accessToken = cookies[ACCESS_COOKIE];
  if (!accessToken) return null;

  const userRes = await supabaseAuthFetch(env, request, '/user', { method: 'GET' }, accessToken);
  if (userRes.ok && userRes.body?.user) {
    return {
      user: userRes.body.user as JsonMap,
      token_type: 'bearer',
      expires_in: null,
    };
  }

  if (userRes.ok && userRes.body?.access_token && userRes.body?.user) {
    return userRes.body;
  }

  return null;
}

export async function handleAuth(
  request: Request,
  env: Env,
  pathname: string
): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return withCors(new Response(null, { status: 204 }), request);
  }

  const authBase = getSupabaseBaseUrl(env);
  const anon = getSupabaseAnonKey(env);
  if (!authBase || !anon) {
    return jsonWithCors(request, {
      ok: false,
      error: 'Autenticação indisponível no momento.',
    }, 500);
  }

  try {
    if (pathname === '/api/auth/session') {
      if (request.method !== 'GET') return withCors(methodNotAllowed(request.method), request);
      const session = await getSessionFromCookies(env, request);
      if (session && session.user) {
        const payload = await buildSessionEnvelope(env, session);
        let response = jsonWithCors(request, payload);
        if (session.access_token || session.refresh_token) {
          response = setSessionCookies(request, response, session as SessionPayload);
        }
        return withCors(response, request);
      }

      const cookies = readCookies(request);
      if (String(cookies[ADMIN_OTP_COOKIE] || '').trim().toLowerCase() === getAdminOtpEmail(env)) {
        return jsonWithCors(request, buildAdminOtpPayload(env), 200);
      }

      const cleared = clearSessionCookies(request, jsonWithCors(request, { ok: true, authenticated: false, user: null, role: null }));
      return withCors(cleared, request);
    }

    if (pathname === '/api/auth/logout') {
      if (request.method !== 'POST') return withCors(methodNotAllowed(request.method), request);
      const cookies = readCookies(request);
      const accessToken = cookies[ACCESS_COOKIE];
      if (accessToken) {
        await supabaseAuthFetch(env, request, '/logout', { method: 'POST' }, accessToken);
      }
      const cleared = clearSessionCookies(request, jsonWithCors(request, { ok: true }));
      return withCors(cleared, request);
    }

    if (request.method !== 'POST') return withCors(methodNotAllowed(request.method), request);

    const body = await parseJsonBody(request);

    if (pathname === '/api/auth/login') {
      const email = String(body.email || '').trim();
      const password = String(body.password || '');
      if (!email || !password) return jsonWithCors(request, { ok: false, error: 'Informe e-mail e senha.' }, 400);

      const authRes = await supabaseAuthFetch(env, request, '/token?grant_type=password', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (!authRes.ok || !authRes.body.user) {
        return jsonWithCors(request, { ok: false, error: mapAuthErrorMessage(authRes.body) }, authRes.status || 401);
      }

      const payload = await buildSessionEnvelope(env, authRes.body);
      const response = setSessionCookies(request, jsonWithCors(request, payload), authRes.body as SessionPayload);
      return withCors(response, request);
    }

    if (pathname === '/api/auth/register') {
      const email = String(body.email || '').trim();
      const password = String(body.password || '');
      const metadata = (body.metadata && typeof body.metadata === 'object') ? (body.metadata as JsonMap) : {};
      if (!email || !password) return jsonWithCors(request, { ok: false, error: 'Informe e-mail e senha para cadastro.' }, 400);

      const authRes = await supabaseAuthFetch(env, request, '/signup', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
          data: metadata,
          options: { emailRedirectTo: getCallbackUrl(env) },
        }),
      });

      if (!authRes.ok) {
        return jsonWithCors(request, { ok: false, error: mapAuthErrorMessage(authRes.body) }, authRes.status || 400);
      }

      if (!authRes.body.user) {
        return jsonWithCors(request, { ok: true, pendingVerification: true }, 200);
      }

      const payload = await buildSessionEnvelope(env, authRes.body);
      let response = jsonWithCors(request, payload);
      if (authRes.body.access_token && authRes.body.refresh_token) {
        response = setSessionCookies(request, response, authRes.body as SessionPayload);
      }
      return withCors(response, request);
    }

    if (pathname === '/api/auth/magic-link' || pathname === '/api/auth/otp/send' || pathname === '/api/auth/recover') {
      const email = String(body.email || '').trim();
      if (!email) return jsonWithCors(request, { ok: false, error: 'Informe o e-mail.' }, 400);

      if (pathname === '/api/auth/otp/send' && String(email).toLowerCase() === getAdminOtpEmail(env)) {
        return jsonWithCors(request, { ok: true, adminOtp: true }, 200);
      }

      if (pathname === '/api/auth/recover') {
        const authRes = await supabaseAuthFetch(env, request, '/recover', {
          method: 'POST',
          body: JSON.stringify({ email, redirect_to: getCallbackUrl(env) }),
        });
        if (!authRes.ok) return jsonWithCors(request, { ok: false, error: mapAuthErrorMessage(authRes.body) }, authRes.status || 400);
        return jsonWithCors(request, { ok: true }, 200);
      }

      const authRes = await supabaseAuthFetch(env, request, '/otp', {
        method: 'POST',
        body: JSON.stringify({
          email,
          create_user: false,
          should_create_user: false,
          email_redirect_to: getCallbackUrl(env),
        }),
      });
      if (!authRes.ok) return jsonWithCors(request, { ok: false, error: mapAuthErrorMessage(authRes.body) }, authRes.status || 400);
      return jsonWithCors(request, { ok: true }, 200);
    }

    if (pathname === '/api/auth/otp/verify') {
      const email = String(body.email || '').trim();
      const token = String(body.token || '').trim();
      const type = String(body.type || 'email').trim();
      if (!email || !token) return jsonWithCors(request, { ok: false, error: 'Informe e-mail e código OTP.' }, 400);

      if (isAdminOtpUser(env, email, token)) {
        const payload = buildAdminOtpPayload(env);
        const response = setAdminOtpCookie(request, jsonWithCors(request, payload, 200), env);
        return withCors(response, request);
      }

      const authRes = await supabaseAuthFetch(env, request, '/verify', {
        method: 'POST',
        body: JSON.stringify({ email, token, type }),
      });
      if (!authRes.ok || !authRes.body.user) return jsonWithCors(request, { ok: false, error: mapAuthErrorMessage(authRes.body) }, authRes.status || 400);

      const payload = await buildSessionEnvelope(env, authRes.body);
      const response = setSessionCookies(request, jsonWithCors(request, payload), authRes.body as SessionPayload);
      return withCors(response, request);
    }

    if (pathname === '/api/auth/update-password') {
      const password = String(body.password || '').trim();
      if (!password) return jsonWithCors(request, { ok: false, error: 'Informe a nova senha.' }, 400);

      const cookies = readCookies(request);
      const accessToken = cookies[ACCESS_COOKIE];
      if (!accessToken) return jsonWithCors(request, { ok: false, error: 'Sessão não encontrada.' }, 401);

      const authRes = await supabaseAuthFetch(env, request, '/user', {
        method: 'PUT',
        body: JSON.stringify({ password }),
      }, accessToken);

      if (!authRes.ok || !authRes.body.user) return jsonWithCors(request, { ok: false, error: mapAuthErrorMessage(authRes.body) }, authRes.status || 400);

      const payload = await buildSessionEnvelope(env, authRes.body);
      return jsonWithCors(request, payload, 200);
    }

    if (pathname === '/api/auth/callback') {
      const accessToken = String(body.access_token || '').trim();

      const tokenHash = String(body.token_hash || '').trim();
      const type = String(body.type || 'magiclink').trim();
      let sessionBody: JsonMap | null = null;

      if (accessToken) {
        const userRes = await supabaseAuthFetch(env, request, '/user', { method: 'GET' }, accessToken);
        if (userRes.ok && userRes.body?.user) {
          sessionBody = {
            access_token: accessToken,
            user: userRes.body.user as JsonMap,
            token_type: 'bearer',
            expires_in: null,
          };
        }
      }

      if (!sessionBody && tokenHash) {
        const verifyRes = await supabaseAuthFetch(env, request, '/verify', {
          method: 'POST',
          body: JSON.stringify({ token_hash: tokenHash, type }),
        });
        if (verifyRes.ok && verifyRes.body?.user) {
          sessionBody = verifyRes.body;
        }
      }

      if (!sessionBody) {
        sessionBody = await getSessionFromCookies(env, request);
      }

      if (!sessionBody || !sessionBody.user) {
        return jsonWithCors(request, { ok: false, error: 'Link inválido ou expirado.' }, 401);
      }

      const payload = await buildSessionEnvelope(env, sessionBody);
      let response = jsonWithCors(request, payload);
      if (sessionBody.access_token || sessionBody.refresh_token) {
        response = setSessionCookies(request, response, sessionBody as SessionPayload);
      }
      return withCors(response, request);
    }

    return withCors(jsonError('Rota de autenticação não encontrada', 404), request);
  } catch (err: any) {
    return jsonWithCors(request, {
      ok: false,
      error: err?.message || 'Erro interno no servidor de autenticação.',
    }, 500);
  }
}
