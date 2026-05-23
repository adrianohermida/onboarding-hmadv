/**
 * Auth Manager - Gerencia autenticação multi-projeto Supabase
 * Projeto Default: sspvizogbcyigquqycsz
 * Projeto Mensageria: fmtmcblvzfisenhvcjoo
 */

const DEFAULT_SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzcHZpem9nYmN5aWdxdXF5Y3N6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3OTYxNTYsImV4cCI6MjA4MzM3MjE1Nn0.C1P4wlanONGA9EDNR4nBujJ136sSXlZCioFyd_CWIfs';

function readRuntimeConfig() {
  const injected = (typeof window !== 'undefined' && window.__HM_SUPABASE__) || {};

  const defaultUrl = injected.defaultUrl || 'https://sspvizogbcyigquqycsz.supabase.co';
  const defaultKey = injected.defaultKey || DEFAULT_SUPABASE_ANON;

  const messagingUrl = injected.messagingUrl || 'https://fmtmcblvzfisenhvcjoo.supabase.co';
  const messagingKey =
    injected.messagingKey ||
    (typeof localStorage !== 'undefined' ? localStorage.getItem('SUPABASE_ANON_KEY_MESSAGING') : null) ||
    null;

  return {
    default: { url: defaultUrl, key: defaultKey },
    messaging: { url: messagingUrl, key: messagingKey },
  };
}

const SUPABASE_CONFIG = {
  default: {
    url: 'https://sspvizogbcyigquqycsz.supabase.co',
    key: DEFAULT_SUPABASE_ANON,
  },
  messaging: {
    url: 'https://fmtmcblvzfisenhvcjoo.supabase.co',
    key: null,
  }
};

class AuthManager {
  constructor() {
    this.defaultClient = null;
    this.messagingClient = null;
    this.currentUser = null;
    this.session = null;
    this.currentAdminRole = null;
  }

  buildCallbackUrl() {
    const origin = window.location.origin;
    return `${origin}/pages/auth-callback.html`;
  }

  getRedirectPath() {
    return this.isAdmin() ? '/admin/index.html' : '/pages/dashboard.html';
  }

  async init() {
    // Inicializa clientes Supabase (assumindo que a lib está carregada globalmente ou via import)
    if (typeof supabase !== 'undefined') {
      const runtimeConfig = readRuntimeConfig();
      SUPABASE_CONFIG.default = runtimeConfig.default;
      SUPABASE_CONFIG.messaging = runtimeConfig.messaging;

      this.defaultClient = supabase.createClient(SUPABASE_CONFIG.default.url, SUPABASE_CONFIG.default.key);

      if (SUPABASE_CONFIG.messaging.key) {
        this.messagingClient = supabase.createClient(SUPABASE_CONFIG.messaging.url, SUPABASE_CONFIG.messaging.key);
      }
      
      // Restaura sessão se existir
      const { data: { session } } = await this.defaultClient.auth.getSession();
      if (session) {
        this.currentUser = session.user || null;
        this.session = session;
        await this.resolveAdminRole();
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

    await this.completeAuth(data);
    return data;
  }

  async completeAuth(data) {
    if (!data?.session) return data;

    // Propaga para o projeto de mensageria
    await this.propagateSession(data.session);
    this.currentUser = data.user;
    this.session = data.session;
    await this.resolveAdminRole();

    // Salva indicador de auth completa
    localStorage.setItem('auth_synced', 'true');
    window.dispatchEvent(new CustomEvent('auth:complete', { detail: data.user }));

    return data;
  }

  async register(email, password, metadata = {}) {
    if (!this.defaultClient) throw new Error('Cliente não inicializado');

    const { data, error } = await this.defaultClient.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: this.buildCallbackUrl(),
        data: metadata,
      },
    });

    if (error) throw error;

    if (data?.session) await this.completeAuth(data);
    return data;
  }

  async sendMagicLink(email) {
    if (!this.defaultClient) throw new Error('Cliente não inicializado');

    const { data, error } = await this.defaultClient.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: this.buildCallbackUrl(),
      },
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

    if (data?.session) await this.completeAuth(data);
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

    const { data: sessionData } = await this.defaultClient.auth.getSession();
    if (sessionData?.session) {
      await this.completeAuth({
        user: sessionData.session.user,
        session: sessionData.session,
      });
    }
    return data;
  }

  onAuthStateChange(callback) {
    if (!this.defaultClient) return { data: { subscription: { unsubscribe() {} } } };
    return this.defaultClient.auth.onAuthStateChange(callback);
  }

  async propagateSession(sourceSession) {
    if (!this.messagingClient) return;

    // Usa o mesmo JWT para logar no segundo projeto
    // Nota: Isso requer que o segundo projeto aceite tokens externos ou use a mesma assinatura JWT
    // Se as chaves JWT forem diferentes, é necessário um endpoint Edge Function para troca de token
    const { error } = await this.messagingClient.auth.setSession({
      access_token: sourceSession.access_token,
      refresh_token: sourceSession.refresh_token,
    });

    if (error) {
      console.warn('Falha ao sincronizar sessão de mensageria:', error.message);
      // Fallback: Tentar login silencioso se o token direto falhar
      await this.fallbackMessagingAuth(sourceSession.access_token);
    } else {
      console.log('Sessão de mensageria sincronizada com sucesso');
    }
  }

  async fallbackMessagingAuth(jwtToken) {
    // Estratégia alternativa: Chamar uma Edge Function que valida o token do projeto A e cria sessão no B
    try {
      const response = await fetch(`${SUPABASE_CONFIG.messaging.url}/functions/v1/sync-auth`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'sync_session' })
      });
      
      if (!response.ok) throw new Error('Edge Function falhou');
      console.log('Sincronização via Edge Function bem-sucedida');
    } catch (e) {
      console.error('Erro crítico na sincronização de auth:', e);
    }
  }

  async logout() {
    if (this.defaultClient) await this.defaultClient.auth.signOut();
    if (this.messagingClient) await this.messagingClient.auth.signOut();
    
    this.currentUser = null;
    this.session = null;
    this.currentAdminRole = null;
    localStorage.removeItem('auth_synced');
    window.dispatchEvent(new CustomEvent('auth:logout'));
  }

  async resolveAdminRole() {
    if (!this.defaultClient || !this.currentUser?.id) {
      this.currentAdminRole = null;
      return null;
    }

    const { data, error } = await this.defaultClient
      .from('admin_users')
      .select('role')
      .eq('user_id', this.currentUser.id)
      .maybeSingle();

    if (error) {
      this.currentAdminRole = null;
      return null;
    }

    this.currentAdminRole = data?.role || null;
    return this.currentAdminRole;
  }

  isAdmin() {
    return !!this.currentAdminRole;
  }
}

// Singleton
window.AuthManager = new AuthManager();