/**
 * Auth Manager - cliente frontend para autenticação via backend BFF.
 * O browser não conversa com o provedor de identidade diretamente.
 */

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
  const currentHost = (typeof window !== 'undefined' && window.location && window.location.hostname) || '';

  const authApiBase =
    injected.baseUrl ||
    readStorageValue('HM_AUTH_API_BASE') ||
    (currentHost === 'portal.hermidamaia.adv.br' ? 'https://api.hermidamaia.adv.br' : '');

  return {
    authApiBase,
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
  }

  buildCallbackUrl() {
    const origin = window.location.origin;
    return `${origin}/pages/auth-callback.html`;
  }

  getRedirectPath() {
    return this.isAdmin() ? '/admin/index.html' : '/pages/dashboard.html';
  }

  validateConfig() {
    const config = this.runtimeConfig || readRuntimeConfig();
    if (typeof config.authApiBase !== 'string') {
      throw new Error('Configuração de autenticação inválida.');
    }
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

  async request(path, init = {}) {
    const response = await fetch(this.resolveApiUrl(path), {
      ...init,
      credentials: 'include',
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

    if (!response.ok || payload.ok === false) {
      throw normalizeError(payload);
    }

    return payload;
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

    const payload = await this.request('/api/auth/session', { method: 'GET' });
    if (payload && payload.authenticated) {
      await this.applyAuthPayload(payload);
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
window.AuthManager = new AuthManager();