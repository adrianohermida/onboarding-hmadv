/**
 * Legacy compatibility shim for historic typo file name (uth-manager.js).
 * Keeps old includes working without breaking the modern AuthManager API.
 */

if (window.AuthManager && typeof window.AuthManager.sendMagicLink === 'function') {
  console.warn('[uth-manager] Legacy script loaded, keeping existing modern AuthManager instance.');
} else {
  const SUPABASE_CONFIG = {
    default: {
      url: (window.__HM_SUPABASE__ && window.__HM_SUPABASE__.defaultUrl) || 'https://sspvizogbcyigquqycsz.supabase.co',
      key: (window.__HM_SUPABASE__ && window.__HM_SUPABASE__.defaultKey) || '',
    },
    messaging: {
      url: (window.__HM_SUPABASE__ && window.__HM_SUPABASE__.messagingUrl) || 'https://cundpbzqghmkohcozsex.supabase.co',
      key: (window.__HM_SUPABASE__ && window.__HM_SUPABASE__.messagingKey) || null,
    }
  };

  class AuthManager {
    constructor() {
      this.defaultClient = null;
      this.messagingClient = null;
      this.currentUser = null;
      this.session = null;
    }

    buildCallbackUrl() {
      return `${window.location.origin}/pages/auth-callback.html`;
    }

    getRedirectPath() {
      return this.isAdmin() ? '/admin/index.html' : '/pages/dashboard.html';
    }

    async init() {
      if (typeof supabase !== 'undefined') {
        this.defaultClient = supabase.createClient(SUPABASE_CONFIG.default.url, SUPABASE_CONFIG.default.key);
        if (SUPABASE_CONFIG.messaging.key) {
          this.messagingClient = supabase.createClient(SUPABASE_CONFIG.messaging.url, SUPABASE_CONFIG.messaging.key);
        }

        const { data: { session } } = await this.defaultClient.auth.getSession();
        if (session) {
          this.currentUser = session.user || null;
          this.session = session;
          await this.propagateSession(session);
        }
      }
      return this;
    }

    async login(email, password) {
      if (!this.defaultClient) throw new Error('Cliente não inicializado');

      const { data, error } = await this.defaultClient.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data?.session) {
        await this.propagateSession(data.session);
        this.currentUser = data.user;
        this.session = data.session;
        localStorage.setItem('auth_synced', 'true');
        window.dispatchEvent(new CustomEvent('auth:complete', { detail: data.user }));
      }

      return data;
    }

    async register(email, password, metadata = {}) {
      if (!this.defaultClient) throw new Error('Cliente não inicializado');
      const { data, error } = await this.defaultClient.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: this.buildCallbackUrl(), data: metadata }
      });
      if (error) throw error;
      if (data?.session) {
        this.currentUser = data.user;
        this.session = data.session;
      }
      return data;
    }

    async sendMagicLink(email) {
      if (!this.defaultClient) throw new Error('Cliente não inicializado');
      const { data, error } = await this.defaultClient.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: this.buildCallbackUrl(), shouldCreateUser: false }
      });
      if (error) throw error;
      return data;
    }

    async sendOtp(email) {
      return this.sendMagicLink(email);
    }

    async verifyOtp(email, token, type = 'email') {
      if (!this.defaultClient) throw new Error('Cliente não inicializado');
      const { data, error } = await this.defaultClient.auth.verifyOtp({
        email,
        token: String(token || '').trim(),
        type,
      });
      if (error) throw error;
      if (data?.session) {
        this.currentUser = data.user;
        this.session = data.session;
        await this.propagateSession(data.session);
      }
      return data;
    }

    async requestPasswordRecovery(email) {
      if (!this.defaultClient) throw new Error('Cliente não inicializado');
      const { data, error } = await this.defaultClient.auth.resetPasswordForEmail(email, {
        redirectTo: this.buildCallbackUrl(),
      });
      if (error) throw error;
      return data;
    }

    async updatePassword(newPassword) {
      if (!this.defaultClient) throw new Error('Cliente não inicializado');
      const { data, error } = await this.defaultClient.auth.updateUser({ password: newPassword });
      if (error) throw error;
      return data;
    }

    async propagateSession(sourceSession) {
      if (!this.messagingClient) return;

      const { error } = await this.messagingClient.auth.setSession({
        access_token: sourceSession.access_token,
        refresh_token: sourceSession.refresh_token,
      });

      if (error) {
        console.warn('Falha ao sincronizar sessão de mensageria:', error.message);
        await this.fallbackMessagingAuth(sourceSession.access_token);
      }
    }

    async fallbackMessagingAuth(jwtToken) {
      try {
        await fetch(`${SUPABASE_CONFIG.messaging.url}/functions/v1/sync-auth`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${jwtToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'sync_session' })
        });
      } catch (e) {
        console.error('Erro crítico na sincronização de auth:', e);
      }
    }

    async logout() {
      if (this.defaultClient) await this.defaultClient.auth.signOut();
      if (this.messagingClient) await this.messagingClient.auth.signOut();
      this.currentUser = null;
      this.session = null;
      localStorage.removeItem('auth_synced');
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }

    isAdmin() {
      return this.currentUser?.email === 'adrianohermida@gmail.com';
    }
  }

  window.AuthManager = new AuthManager();
}