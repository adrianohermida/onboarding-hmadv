/**
 * Auth Manager - Gerencia autenticação multi-projeto Supabase
 * Projeto Default: sspvizogbcyigquqycsz
 * Projeto Mensageria: cundpbzqghmkohcozsex
 */

const DEFAULT_SUPABASE_URL = 'https://sspvizogbcyigquqycsz.supabase.co';
const DEFAULT_MESSAGING_URL = 'https://cundpbzqghmkohcozsex.supabase.co';

function readStorageValue(key) {
  try {
    if (typeof localStorage === 'undefined') return null;
    const value = localStorage.getItem(key);
    return value && String(value).trim() ? String(value).trim() : null;
  } catch (_) {
    return null;
  }
}

function looksLikeSupabaseJwt(value) {
  return typeof value === 'string' && value.split('.').length === 3;
}

function mapAuthError(error) {
  if (!error) return new Error('Falha de autenticação no Supabase.');
  const status = Number(error.status || error?.response?.status || 0);
  const message = String(error.message || '').toLowerCase();

  if (status === 401 && (message.includes('invalid api key') || message.includes('invalid') || message.includes('jwt'))) {
    return new Error('Chave ANON do Supabase inválida ou desatualizada. Atualize SUPABASE_ANON_KEY / NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  }

  if (message.includes('invalid login credentials')) {
    return new Error('E-mail ou senha inválidos.');
  }

  if (message.includes('email not confirmed')) {
    return new Error('E-mail não confirmado. Verifique sua caixa de entrada antes de entrar.');
  }

  return new Error(error.message || 'Falha de autenticação no Supabase.');
}

function readRuntimeConfig() {
  const injected = (typeof window !== 'undefined' && window.__HM_SUPABASE__) || {};
  const defaultUrl =
    injected.defaultUrl ||
    readStorageValue('SUPABASE_URL') ||
    readStorageValue('NEXT_PUBLIC_SUPABASE_URL') ||
    DEFAULT_SUPABASE_URL;

  const defaultKey =
    injected.defaultKey ||
    readStorageValue('SUPABASE_ANON_KEY') ||
    readStorageValue('NEXT_PUBLIC_SUPABASE_ANON_KEY') ||
    '';

  const messagingUrl = injected.messagingUrl || readStorageValue('SUPABASE_URL_MESSAGING') || DEFAULT_MESSAGING_URL;
  const messagingKey =
    injected.messagingKey ||
    readStorageValue('SUPABASE_ANON_KEY_MESSAGING') ||
    null;

  return {
    default: { url: defaultUrl, key: defaultKey },
    messaging: { url: messagingUrl, key: messagingKey },
  };
}

const SUPABASE_CONFIG = {
  default: {
    url: DEFAULT_SUPABASE_URL,
    key: '',
  },
  messaging: {
    url: DEFAULT_MESSAGING_URL,
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
    const defaultUrl = String(config?.default?.url || '');
    const defaultKey = String(config?.default?.key || '');

    if (!defaultUrl.startsWith('https://') || !defaultUrl.includes('.supabase.co')) {
      throw new Error('SUPABASE_URL inválida. Verifique window.__HM_SUPABASE__.defaultUrl.');
    }

    if (!looksLikeSupabaseJwt(defaultKey)) {
      throw new Error('SUPABASE_ANON_KEY inválida ou ausente. Configure window.__HM_SUPABASE__.defaultKey ou localStorage SUPABASE_ANON_KEY.');
    }
  }

  ensureReady() {
    if (!this.initialized || !this.defaultClient) {
      throw new Error('AuthManager não inicializado. Recarregue a página e tente novamente.');
    }
  }

  async init() {
    if (typeof supabase === 'undefined' || typeof supabase.createClient !== 'function') {
      throw new Error('SDK do Supabase não carregado.');
    }

    this.runtimeConfig = readRuntimeConfig();
    this.validateConfig();

    SUPABASE_CONFIG.default = this.runtimeConfig.default;
    SUPABASE_CONFIG.messaging = this.runtimeConfig.messaging;

    this.defaultClient = supabase.createClient(SUPABASE_CONFIG.default.url, SUPABASE_CONFIG.default.key);

    if (SUPABASE_CONFIG.messaging.key && looksLikeSupabaseJwt(SUPABASE_CONFIG.messaging.key)) {
      this.messagingClient = supabase.createClient(SUPABASE_CONFIG.messaging.url, SUPABASE_CONFIG.messaging.key);
    } else {
      this.messagingClient = null;
    }

    const { data: { session }, error } = await this.defaultClient.auth.getSession();
    if (error) {
      throw mapAuthError(error);
    }

    if (session) {
      this.currentUser = session.user || null;
      this.session = session;
      await this.resolveAdminRole();
      await this.propagateSession(session);
    }

    this.initialized = true;
    return this;
  }

  async login(email, password) {
    this.ensureReady();

    const { data, error } = await this.defaultClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw mapAuthError(error);

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
    try {
      localStorage.setItem('auth_synced', 'true');
    } catch (_) {}
    window.dispatchEvent(new CustomEvent('auth:complete', { detail: data.user }));

    return data;
  }

  async register(email, password, metadata = {}) {
    this.ensureReady();

    const { data, error } = await this.defaultClient.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: this.buildCallbackUrl(),
        data: metadata,
      },
    });

    if (error) throw mapAuthError(error);

    if (data?.session) await this.completeAuth(data);
    return data;
  }

  async sendMagicLink(email) {
    this.ensureReady();

    const { data, error } = await this.defaultClient.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: this.buildCallbackUrl(),
      },
    });

    if (error) throw mapAuthError(error);
    return data;
  }

  async sendOtp(email) {
    this.ensureReady();

    const { data, error } = await this.defaultClient.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
      },
    });

    if (error) throw mapAuthError(error);
    return data;
  }

  async verifyOtp(email, token, type = 'email') {
    this.ensureReady();

    const { data, error } = await this.defaultClient.auth.verifyOtp({
      email,
      token: String(token || '').trim(),
      type,
    });

    if (error) throw mapAuthError(error);

    if (data?.session) await this.completeAuth(data);
    return data;
  }

  async requestPasswordRecovery(email) {
    this.ensureReady();

    const { data, error } = await this.defaultClient.auth.resetPasswordForEmail(email, {
      redirectTo: this.buildCallbackUrl(),
    });

    if (error) throw mapAuthError(error);
    return data;
  }

  async updatePassword(newPassword) {
    this.ensureReady();

    const { data, error } = await this.defaultClient.auth.updateUser({ password: newPassword });

    if (error) throw mapAuthError(error);

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
    if (!this.defaultClient) {
      return { data: { subscription: { unsubscribe() {} } } };
    }
    return this.defaultClient.auth.onAuthStateChange(callback);
  }

  async propagateSession(sourceSession) {
    if (!this.messagingClient || !sourceSession?.access_token || !sourceSession?.refresh_token) return;

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
    try {
      localStorage.removeItem('auth_synced');
    } catch (_) {}
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