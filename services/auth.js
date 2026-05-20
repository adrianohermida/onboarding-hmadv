import { supabase }      from './supabase.js';
import { getCallbackUrl } from '../utils/config.js';

export const AuthService = {
  async sendMagicLink(email) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: getCallbackUrl() },
    });
    if (error) return { ok: false, message: error.message };
    return { ok: true };
  },

  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) return null;
    return session;
  },

  async getUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user || null;
  },

  async logout() {
    await supabase.auth.signOut();
    const base = window.location.pathname.includes('/pages/') ? '' : 'pages/';
    window.location.href = base + 'login.html';
  },

  async isAuthenticated() {
    const session = await this.getSession();
    return !!session;
  },

  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  },
};
