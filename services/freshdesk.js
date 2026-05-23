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

function normalizeTicketListResponse(response, params) {
  const normalized = normalizeListParams(params);
  const data = Array.isArray(response?.data) ? response.data : [];
  const total = Number(response?.total ?? data.length);
  const page = Number(response?.page ?? normalized.page);
  const pageSize = Number(response?.pageSize ?? normalized.pageSize);
  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.max(Number(response?.totalPages ?? Math.ceil(total / pageSize)), 1),
  };
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      resolve(result.includes(',') ? result.split(',').pop() : result);
    };
    reader.onerror = () => reject(reader.error || new Error('Falha ao ler anexo'));
    reader.readAsDataURL(file);
  });
}

async function normalizeAttachments(files = []) {
  const list = Array.from(files || []).filter(Boolean);
  if (!list.length) return [];

  const maxSize = 15 * 1024 * 1024;
  return Promise.all(list.map(async file => {
    if (file.size > maxSize) {
      throw new Error(`O anexo ${file.name} excede 15MB.`);
    }
    return {
      name: file.name,
      type: file.type || 'application/octet-stream',
      size: file.size,
      contentBase64: await fileToBase64(file),
    };
  }));
}

function normalizeListParams(params = {}) {
  const page = Math.max(parseInt(params.page || 1, 10), 1);
  const pageSize = Math.min(Math.max(parseInt(params.pageSize || 10, 10), 5), 50);
  return {
    page,
    pageSize,
    status: params.status ? Number(params.status) : null,
    priority: params.priority ? Number(params.priority) : null,
    search: String(params.search || '').trim(),
    from: params.from || null,
    to: params.to || null,
  };
}

export const FreshdeskService = {
  STATUS:   FD_STATUS,
  PRIORITY: FD_PRIORITY,

  async listTickets(params = {}) {
    const filters = normalizeListParams(params);
    const response = await invokeEdgeFunction('freshdesk-proxy', {
      method: 'POST',
      body: { action: 'list_tickets', ...filters },
      includeApiKey: false,
      timeoutMs: 18000,
      retries: 0,
    });
    return normalizeTicketListResponse(response, filters);
  },

  async getContact() {
    const response = await invokeEdgeFunction('freshdesk-proxy', {
      method: 'POST',
      body: { action: 'get_contact' },
      includeApiKey: false,
      timeoutMs: 12000,
      retries: 0,
    });
    return response?.contact || null;
  },

  async createTicket({ subject, description, tags = [], priority = 1, attachments = [] }) {
    if (!subject?.trim()) throw new Error('Assunto obrigatório');
    if (!description?.trim()) throw new Error('Descrição obrigatória');

    try {
      const normalizedAttachments = await normalizeAttachments(attachments);
      const response = await invokeEdgeFunction('freshdesk-proxy', {
        method: 'POST',
        body: { action: 'create_ticket', subject, description, priority, tags, attachments: normalizedAttachments },
        includeApiKey: false,
        timeoutMs: normalizedAttachments.length ? 45000 : 20000,
        retries: 0,
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
