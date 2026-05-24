/**
 * Auth Manager - cliente frontend para autenticação via backend BFF.
 * O browser não conversa com o provedor de identidade diretamente.
 * 
 * CORREÇÃO APLICADA: Removido 'credentials: include' da requisição fetch
 * para resolver erro de CORS quando o backend não envia o header correto.
 * A autenticação via Token (Authorization Header) continua funcionando.
 */

const LEGACY_ACCESS_TOKEN_KEY = 'hm_legacy_access_token';
const LEGACY_REFRESH_TOKEN_KEY = 'hm_legacy_refresh_token';
const LEGACY_USER_KEY = 'hm_legacy_user';
const LEGACY_ROLE_KEY = 'hm_legacy_role';

function readStorageValue(key) {
  try {
    if (typeof localStorage === 'undefined') return null;
    const value = localStorage.getItem(key);
    return value && String(value).trim() ? String(value).trim() : null;
  } catch (_) {
    return null;
  }
}

function readRuntimeConfig() {
  const injected = (typeof window !== 'undefined' && window.__HM_AUTH__) || {};
  const supabaseInjected = (typeof window !== 'undefined' && window.__HM_SUPABASE__) || {};
  const currentHost = (typeof window !== 'undefined' && window.location && window.location.hostname) || '';

  // Remove espaços em branco acidentais na URL base se houver
  const rawBaseUrl = injected.baseUrl ||
    readStorageValue('HM_AUTH_API_BASE') ||
    (currentHost === 'portal.hermidamaia.adv.br' ? 'https://api.hermidamaia.adv.br' : '');
  
  const authApiBase = String(rawBaseUrl).trim();

  return {
    authApiBase,
    supabaseUrl: String(supabaseInjected.defaultUrl || '').trim(),
    supabaseAnonKey: String(supabaseInjected.defaultKey || '').trim(),
  };
}

function normalizeError(error) {
  if (!error) return new Error('Falha de autenticação.');
  if (typeof error === 'string') return new Error(error);
  const message = String(error.message || error.error || 'Falha de autenticação.').trim();
  return new Error(message || 'Falha de autenticação.');
}

class AuthManager {
  constructor() {
    this.currentUser = null;
    this.session = null;
    this.currentAdminRole = null;
    this.initialized = false;
    this.runtimeConfig = readRuntimeConfig();
    this.authMode = 'bff';
  }

  buildCallbackUrl() {
    const origin = window.location.origin;
    return `${origin}/pages/auth-callback.html`;
  }

  buildLegacyOAuthUrl(provider, redirectTo = '') {
    const base = this.legacyBaseUrl();
    const callback = String(redirectTo || this.buildCallbackUrl()).trim() || this.buildCallbackUrl();
    const url = new URL(`${base}/auth/v1/authorize`);
    url.searchParams.set('provider', provider);
    url.searchParams.set('redirect_to', callback);
    return url.toString();
  }

  getRedirectPath() {
    return this.isAdmin() ? '/admin/index.html' : '/pages/dashboard.html';
  }

  validateConfig() {
    const config = this.runtimeConfig || readRuntimeConfig();
    if (typeof config.authApiBase !== 'string' || !config.authApiBase) {
      throw new Error('Configuração de autenticação inválida (URL da API ausente).');
    }
  }

  canUseLegacy() {
    const cfg = this.runtimeConfig || {};
    const host = (typeof window !== 'undefined' && window.location && window.location.hostname) || '';
    const isLocalDev = host === 'localhost' || host === '127.0.0.1';
    return Boolean(isLocalDev && cfg.supabaseUrl && cfg.supabaseAnonKey);
  }

  ensureReady() {
    if (!this.initialized) {
      throw new Error('AuthManager não inicializado. Recarregue a página e tente novamente.');
    }
  }

  resolveApiUrl(path) {
    const base = String((this.runtimeConfig && this.runtimeConfig.authApiBase) || '').trim();
    if (!base) return path;
    const sanitizedBase = base.replace(/\/$/, '');
    return `${sanitizedBase}${path}`;
  }

  async fetchJson(url, init = {}) {
    const response = await fetch(url, init);
    let payload = {};
    try {
      payload = await response.json();
    } catch (_) {
      payload = {};
    }
    return { response, payload };
  }

  legacyHeaders(extra = {}, token = '') {
    const anonKey = this.runtimeConfig.supabaseAnonKey;
    const headers = {
      'Content-Type': 'application/json',
      apikey: anonKey,
      ...extra,
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  }

  legacyBaseUrl() {
    return String(this.runtimeConfig.supabaseUrl || '').replace(/\/$/, '');
  }

  readLegacySession() {
    const accessToken = readStorageValue(LEGACY_ACCESS_TOKEN_KEY) || '';
    const refreshToken = readStorageValue(LEGACY_REFRESH_TOKEN_KEY) || '';
    let user = null;
    try {
      const raw = localStorage.getItem(LEGACY_USER_KEY);
      user = raw ? JSON.parse(raw) : null;
    } catch (_) {
      user = null;
    }

    return {
      accessToken,
      refreshToken,
      user,
      role: readStorageValue(LEGACY_ROLE_KEY) || null,
    };
  }

  persistLegacySession(payload) {
    const accessToken = String(payload.access_token || '').trim();
    const refreshToken = String(payload.refresh_token || '').trim();
    const user = payload.user || null;

    if (accessToken) localStorage.setItem(LEGACY_ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken) localStorage.setItem(LEGACY_REFRESH_TOKEN_KEY, refreshToken);
    if (user) localStorage.setItem(LEGACY_USER_KEY, JSON.stringify(user));
  }

  clearLegacySession() {
    try {
      localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY);
      localStorage.removeItem(LEGACY_REFRESH_TOKEN_KEY);
      localStorage.removeItem(LEGACY_USER_KEY);
      localStorage.removeItem(LEGACY_ROLE_KEY);
    } catch (_) {}
  }

  async resolveLegacyRole(userId, accessToken) {
    if (!userId || !accessToken) return null;

    const url = new URL(`${this.legacyBaseUrl()}/rest/v1/admin_users`);
    url.searchParams.set('select', 'role');
    url.searchParams.set('user_id', `eq.${userId}`);
    url.searchParams.set('limit', '1');

    const { response, payload } = await this.fetchJson(url.toString(), {
      method: 'GET',
      headers: this.legacyHeaders({}, accessToken),
    });

    if (!response.ok || !Array.isArray(payload) || !payload[0] || !payload[0].role) {
      localStorage.removeItem(LEGACY_ROLE_KEY);
      return null;
    }

    localStorage.setItem(LEGACY_ROLE_KEY, String(payload[0].role));
    return String(payload[0].role);
  }

  async legacyRequest(path, init = {}) {
    const method = String(init.method || 'GET').toUpperCase();
    const body = init.body ? JSON.parse(String(init.body)) : {};
    const base = this.legacyBaseUrl();
    const current = this.readLegacySession();

    if (path === '/api/auth/session') {
      if (!current.accessToken) {
        return { ok: true, authenticated: false, user: null, role: null };
      }

      let userRes = await this.fetchJson(`${base}/auth/v1/user`, {
        method: 'GET',
        headers: this.legacyHeaders({}, current.accessToken),
      });

      if (!userRes.response.ok && current.refreshToken) {
        const refreshRes = await this.fetchJson(`${base}/auth/v1/token?grant_type=refresh_token`, {
          method: 'POST',
          headers: this.legacyHeaders(),
          body: JSON.stringify({ refresh_token: current.refreshToken }),
        });

        if (refreshRes.response.ok && refreshRes.payload?.access_token) {
          this.persistLegacySession(refreshRes.payload);
          userRes = await this.fetchJson(`${base}/auth/v1/user`, {
            method: 'GET',
            headers: this.legacyHeaders({}, refreshRes.payload.access_token),
          });
        }
      }

      if (!userRes.response.ok || !userRes.payload?.user) {
        this.clearLegacySession();
        return { ok: true, authenticated: false, user: null, role: null };
      }

      const user = userRes.payload.user;
      const role = await this.resolveLegacyRole(String(user.id || ''), this.readLegacySession().accessToken);
      return {
        ok: true,
        authenticated: true,
        user,
        role,
        session: { token_type: 'bearer', expires_in: null },
      };
    }

    if (path === '/api/auth/login' && method === 'POST') {
      const authRes = await this.fetchJson(`${base}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: this.legacyHeaders(),
        body: JSON.stringify({ email: body.email, password: body.password }),
      });

      if (!authRes.response.ok || !authRes.payload?.user) throw normalizeError(authRes.payload);
      this.persistLegacySession(authRes.payload);
      const role = await this.resolveLegacyRole(String(authRes.payload.user.id || ''), String(authRes.payload.access_token || ''));
      return {
        ok: true,
        user: authRes.payload.user,
        role,
        session: {
          token_type: String(authRes.payload.token_type || 'bearer'),
          expires_in: Number(authRes.payload.expires_in || 0) || null,
        },
      };
    }

    if (path === '/api/auth/register' && method === 'POST') {
      const authRes = await this.fetchJson(`${base}/auth/v1/signup`, {
        method: 'POST',
        headers: this.legacyHeaders(),
        body: JSON.stringify({
          email: body.email,
          password: body.password,
          data: body.metadata || {},
          options: { emailRedirectTo: this.buildCallbackUrl() },
        }),
      });
      if (!authRes.response.ok) throw normalizeError(authRes.payload);
      if (authRes.payload?.access_token && authRes.payload?.user) {
        this.persistLegacySession(authRes.payload);
      }
      return {
        ok: true,
        pendingVerification: !authRes.payload?.user,
        user: authRes.payload?.user || null,
        role: null,
        session: authRes.payload?.user ? { token_type: String(authRes.payload.token_type || 'bearer'), expires_in: Number(authRes.payload.expires_in || 0) || null } : null,
      };
    }

    if ((path === '/api/auth/magic-link' || path === '/api/auth/otp/send') && method === 'POST') {
      const authRes = await this.fetchJson(`${base}/auth/v1/otp`, {
        method: 'POST',
        headers: this.legacyHeaders(),
        body: JSON.stringify({
          email: body.email,
          should_create_user: false,
          create_user: false,
          email_redirect_to: this.buildCallbackUrl(),
        }),
      });
      if (!authRes.response.ok) throw normalizeError(authRes.payload);
      return { ok: true };
    }

    if (path === '/api/auth/otp/verify' && method === 'POST') {
      const authRes = await this.fetchJson(`${base}/auth/v1/verify`, {
        method: 'POST',
        headers: this.legacyHeaders(),
        body: JSON.stringify({ email: body.email, token: body.token, type: body.type || 'email' }),
      });
      if (!authRes.response.ok || !authRes.payload?.user) throw normalizeError(authRes.payload);
      this.persistLegacySession(authRes.payload);
      const role = await this.resolveLegacyRole(String(authRes.payload.user.id || ''), String(authRes.payload.access_token || ''));
      return {
        ok: true,
        user: authRes.payload.user,
        role,
        session: { token_type: String(authRes.payload.token_type || 'bearer'), expires_in: Number(authRes.payload.expires_in || 0) || null },
      };
    }

    if (path === '/api/auth/recover' && method === 'POST') {
      const authRes = await this.fetchJson(`${base}/auth/v1/recover`, {
        method: 'POST',
        headers: this.legacyHeaders(),
        body: JSON.stringify({ email: body.email, redirect_to: this.buildCallbackUrl() }),
      });
      if (!authRes.response.ok) throw normalizeError(authRes.payload);
      return { ok: true };
    }

    if (path === '/api/auth/update-password' && method === 'POST') {
      if (!current.accessToken) throw new Error('Sessão não encontrada.');

      const authRes = await this.fetchJson(`${base}/auth/v1/user`, {
        method: 'PUT',
        headers: this.legacyHeaders({}, current.accessToken),
        body: JSON.stringify({ password: body.password }),
      });
      if (!authRes.response.ok || !authRes.payload?.user) throw normalizeError(authRes.payload);
      return {
        ok: true,
        user: authRes.payload.user,
        role: current.role || null,
        session: { token_type: 'bearer', expires_in: null },
      };
    }

    if (path === '/api/auth/logout' && method === 'POST') {
      if (current.accessToken) {
        await this.fetchJson(`${base}/auth/v1/logout`, {
          method: 'POST',
          headers: this.legacyHeaders({}, current.accessToken),
        });
      }
      this.clearLegacySession();
      return { ok: true };
    }

    if (path === '/api/auth/oauth/start' && method === 'POST') {
      const provider = String(body.provider || '').trim().toLowerCase();
      if (!provider || !['google', 'facebook'].includes(provider)) {
        throw new Error('Provedor OAuth inválido.');
      }

      return {
        ok: true,
        provider,
        url: this.buildLegacyOAuthUrl(provider, body.redirectTo || this.buildCallbackUrl()),
      };
    }

    throw new Error('Fluxo de autenticação não suportado no modo legado.');
  }

  async request(path, init = {}) {
    if (this.authMode === 'legacy') {
      return this.legacyRequest(path, init);
    }

    try {
      // CORREÇÃO: Removido 'credentials: include' para evitar erro de CORS
      // A autenticação é feita via Token no header, não via Cookie neste contexto
      const response = await fetch(this.resolveApiUrl(path), {
        ...init,
        // credentials: 'include', <--- REMOVIDO
        headers: {
          'Content-Type': 'application/json',
          ...(init.headers || {}),
        },
      });

      let payload = {};
      try {
        payload = await response.json();
      } catch (_) {
        payload = {};
      }

      if ((response.status === 404 || response.status === 405) && this.canUseLegacy()) {
        console.warn('[AuthManager] BFF indisponível, alternando para modo legado.');
        this.authMode = 'legacy';
        return this.legacyRequest(path, init);
      }

      if (!response.ok || payload.ok === false) {
        throw normalizeError(payload);
      }

      return payload;
    } catch (error) {
      console.error('[AuthManager] request failed', {
        path,
        authMode: this.authMode,
        message: String((error && error.message) || error || ''),
      });

      if (this.canUseLegacy()) {
        this.authMode = 'legacy';
        return this.legacyRequest(path, init);
      }
      throw error;
    }
  }

  async applyAuthPayload(payload) {
    const user = payload?.user || null;
    const role = payload?.role || null;

    this.currentUser = user;
    this.currentAdminRole = role;
    this.session = payload?.session || null;

    if (user) {
      try {
        localStorage.setItem('auth_synced', 'true');
      } catch (_) {}
      window.dispatchEvent(new CustomEvent('auth:complete', { detail: user }));
    }

    return payload;
  }

  async init() {
    this.runtimeConfig = readRuntimeConfig();
    this.validateConfig();

    try {
      const payload = await this.request('/api/auth/session', { method: 'GET' });
      if (payload && payload.authenticated) {
        await this.applyAuthPayload(payload);
      }
    } catch (e) {
      console.warn('[AuthManager] Falha ao iniciar sessão automaticamente.', e);
    }

    this.initialized = true;
    return this;
  }

  async login(email, password) {
    this.ensureReady();

    const payload = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    await this.completeAuth(payload);
    return payload;
  }

  async completeAuth(data) {
    if (!data?.user) return data;
    return this.applyAuthPayload(data);
  }

  async register(email, password, metadata = {}) {
    this.ensureReady();

    const payload = await this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, metadata }),
    });

    if (payload?.user) await this.completeAuth(payload);
    return payload;
  }

  async sendMagicLink(email) {
    this.ensureReady();

    return this.request('/api/auth/magic-link', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async signInWithProvider(provider) {
    this.ensureReady();
    const normalizedProvider = String(provider || '').trim().toLowerCase();

    const payload = await this.request('/api/auth/oauth/start', {
      method: 'POST',
      body: JSON.stringify({ provider: normalizedProvider, redirectTo: this.buildCallbackUrl() }),
    });

    const targetUrl = String(payload?.url || '').trim();
    if (!targetUrl) {
      throw new Error('Não foi possível iniciar autenticação social.');
    }

    window.location.assign(targetUrl);
    return payload;
  }

  async sendOtp(email) {
    this.ensureReady();

    return this.request('/api/auth/otp/send', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async verifyOtp(email, token, type = 'email') {
    this.ensureReady();

    const payload = await this.request('/api/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ email, token: String(token || '').trim(), type }),
    });

    if (payload?.user) await this.completeAuth(payload);
    return payload;
  }

  async requestPasswordRecovery(email) {
    this.ensureReady();

    return this.request('/api/auth/recover', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async updatePassword(newPassword) {
    this.ensureReady();

    const payload = await this.request('/api/auth/update-password', {
      method: 'POST',
      body: JSON.stringify({ password: newPassword }),
    });

    if (payload?.user) await this.completeAuth(payload);
    return payload;
  }

  onAuthStateChange(callback) {
    if (typeof callback === 'function') {
      window.addEventListener('auth:complete', event => callback('SIGNED_IN', event.detail || null));
      window.addEventListener('auth:logout', () => callback('SIGNED_OUT', null));
    }
    return { data: { subscription: { unsubscribe() {} } } };
  }

  async propagateSession() {
    return null;
  }

  async fallbackMessagingAuth() {
    return null;
  }

  async logout() {
    if (this.initialized) {
      try {
        await this.request('/api/auth/logout', { method: 'POST' });
      } catch (_) {}
    }

    this.clearLegacySession();

    this.currentUser = null;
    this.session = null;
    this.currentAdminRole = null;
    try {
      localStorage.removeItem('auth_synced');
    } catch (_) {}
    window.dispatchEvent(new CustomEvent('auth:logout'));
  }

  async resolveAdminRole() {
    this.currentAdminRole = this.currentAdminRole || null;
    return this.currentAdminRole;
  }

  isAdmin() {
    return !!this.currentAdminRole;
  }
}

// Singleton
if (typeof window !== 'undefined') {
  window.AuthManager = new AuthManager();
}