import { supabase } from './supabase.js';
import { invokeEdgeFunction, toFriendlyMessage } from './edge.js';

export const FD_STATUS = {
  2: { label: 'Aberto',    cls: 'chip-warn' },
  3: { label: 'Pendente',  cls: 'chip-blue' },
  4: { label: 'Resolvido', cls: 'chip-ok'   },
  5: { label: 'Fechado',   cls: 'chip-muted'},
};

export const FD_PRIORITY = {
  1: { label: 'Baixa',   cls: 'chip-muted' },
  2: { label: 'Média',   cls: 'chip-blue'  },
  3: { label: 'Alta',    cls: 'chip-warn'  },
  4: { label: 'Urgente', cls: 'chip-red'   },
};

export const TICKET_URL = 'https://hmdesk.freshdesk.com/support/tickets';

async function currentEmail() {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.email || null;
}

function normalizeTicketResponse(response) {
  if (!response) return null;
  const ticket = response.ticket || response;
  const id = response.fd_ticket_id || response.id || ticket.id;
  return {
    ...ticket,
    id,
    fd_ticket_id: id,
    requester_email: response.requester_email || ticket.requester_email,
    support_email: response.support_email || ticket.support_email,
  };
}

export const FreshdeskService = {
  STATUS:   FD_STATUS,
  PRIORITY: FD_PRIORITY,

  async listTickets() {
    const { data, error } = await supabase
      .from('freshdesk_tickets')
      .select('fd_ticket_id, subject, status, priority, tags, requester_email, support_email, created_at, updated_at')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return data || [];
  },

  async getContact() {
    const email = await currentEmail();
    if (!email) return null;

    const { data, error } = await supabase
      .from('freshdesk_contacts')
      .select('name, email, phone, cpf, status, lifecycle_stage, tickets_count')
      .eq('email', email)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async createTicket({ subject, description, tags = [] }) {
    if (!subject?.trim()) throw new Error('Assunto obrigatório');
    if (!description?.trim()) throw new Error('Descrição obrigatória');

    try {
      const response = await invokeEdgeFunction('freshdesk-proxy', {
        method: 'POST',
        body: { action: 'create_ticket', subject, description, tags },
        timeoutMs: 20000,
        retries: 1,
      });
      return normalizeTicketResponse(response);
    } catch (error) {
      const friendly = toFriendlyMessage(error, 'Não foi possível criar o chamado agora. Tente novamente.');
      throw new Error(friendly);
    }
  },

  ticketUrl(id) {
    return `${TICKET_URL}/${id}`;
  },
};
