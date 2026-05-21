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

export const FreshdeskService = {
  STATUS:   FD_STATUS,
  PRIORITY: FD_PRIORITY,

  async listTickets() {
    const { data, error } = await supabase
      .from('freshdesk_tickets')
      .select('fd_ticket_id, subject, status, priority, tags, created_at, updated_at')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return data || [];
  },

  async getContact() {
    const { data, error } = await supabase
      .from('freshdesk_contacts')
      .select('name, email, phone, cpf, status, lifecycle_stage, tickets_count')
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async createTicket({ subject, description, tags = [] }) {
    if (!subject?.trim()) throw new Error('Assunto obrigatorio');
    if (!description?.trim()) throw new Error('Descricao obrigatoria');

    try {
      return await invokeEdgeFunction('freshdesk-proxy', {
        method: 'POST',
        body: { action: 'create_ticket', subject, description, tags },
        timeoutMs: 15000,
        retries: 2,
      });
    } catch (error) {
      const friendly = toFriendlyMessage(error, 'Nao foi possivel criar o chamado agora. Tente novamente.');
      throw new Error(friendly);
    }
  },

  ticketUrl(id) {
    return `${TICKET_URL}/${id}`;
  },
};
