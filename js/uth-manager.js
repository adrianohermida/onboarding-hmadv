/**
 * Auth Manager - Gerencia autenticação multi-projeto Supabase
 * Projeto Default: sspvizogbcyigquqycsz
 * Projeto Mensageria: fmtmcblvzfisenhvcjoo
 */

const SUPABASE_CONFIG = {
  default: {
    url: 'https://sspvizogbcyigquqycsz.supabase.co',
    key: 'SUPABASE_ANON_KEY', // Substituir pela chave real ou env
  },
  messaging: {
    url: 'https://fmtmcblvzfisenhvcjoo.supabase.co',
    key: 'SUPABASE_ANON_KEY_MESSAGING', // Substituir pela chave real ou env
  }
};

class AuthManager {
  constructor() {
    this.defaultClient = null;
    this.messagingClient = null;
    this.currentUser = null;
    this.session = null;
  }

  async init() {
    // Inicializa clientes Supabase (assumindo que a lib está carregada globalmente ou via import)
    if (typeof supabase !== 'undefined') {
      this.defaultClient = supabase.createClient(SUPABASE_CONFIG.default.url, SUPABASE_CONFIG.default.key);
      this.messagingClient = supabase.createClient(SUPABASE_CONFIG.messaging.url, SUPABASE_CONFIG.messaging.key);
      
      // Restaura sessão se existir
      const { data: { session } } = await this.defaultClient.auth.getSession();
      if (session) {
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

    // Propaga para o projeto de mensageria
    if (data.session) {
      await this.propagateSession(data.session);
      this.currentUser = data.user;
      this.session = data.session;
      
      // Salva indicador de auth completa
      localStorage.setItem('auth_synced', 'true');
      window.dispatchEvent(new CustomEvent('auth:complete', { detail: data.user }));
    }

    return data;
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
    localStorage.removeItem('auth_synced');
    window.dispatchEvent(new CustomEvent('auth:logout'));
  }

  isAdmin() {
    return this.currentUser?.email === 'adrianohermida@gmail.com';
  }
}

// Singleton
window.AuthManager = new AuthManager();