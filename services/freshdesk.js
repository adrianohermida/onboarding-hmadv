/**
 * FreshdeskService — placeholder para integração Freshdesk.
 * Será implementado no Sprint 2 (integração Freshdesk).
 * Endpoints previstos: tickets, contatos, anexos.
 */
export const FreshdeskService = {
  async createTicket(data) {
    console.warn('[FRESHDESK] createTicket — not implemented.', data);
    return { ok: false, ticketId: null };
  },

  async getTicket(ticketId) {
    console.warn('[FRESHDESK] getTicket — not implemented. id:', ticketId);
    return null;
  },

  async updateTicket(ticketId, data) {
    console.warn('[FRESHDESK] updateTicket — not implemented.', ticketId, data);
    return { ok: false };
  },

  async uploadAttachment(ticketId, file) {
    console.warn('[FRESHDESK] uploadAttachment — not implemented.', ticketId, file?.name);
    return { ok: false };
  },

  async getContact(email) {
    console.warn('[FRESHDESK] getContact — not implemented. email:', email);
    return null;
  },

  async createContact(data) {
    console.warn('[FRESHDESK] createContact — not implemented.', data);
    return { ok: false };
  },
};
