import { STORAGE_KEYS } from '../utils/constants.js';

/**
 * StorageService — wrapper sobre localStorage.
 * Centraliza acesso e serialização para facilitar migração futura
 * para IndexedDB ou API remota.
 */
export const StorageService = {
  get(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },

  remove(key) {
    localStorage.removeItem(key);
  },

  clear() {
    Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
  },

  getUser()    { return this.get(STORAGE_KEYS.USER); },
  setUser(u)   { return this.set(STORAGE_KEYS.USER, u); },

  getCase()    { return this.get(STORAGE_KEYS.CASE); },
  setCase(c)   { return this.set(STORAGE_KEYS.CASE, c); },

  getToken()   { return this.get(STORAGE_KEYS.AUTH_TOKEN); },
  setToken(t)  { return this.set(STORAGE_KEYS.AUTH_TOKEN, t); },
};
