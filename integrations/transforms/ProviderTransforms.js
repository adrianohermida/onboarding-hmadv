export function normalizeFreshdeskTicket(payload = {}) {
  return {
    id: payload.id || payload.fd_ticket_id || null,
    subject: payload.subject || '',
    status: payload.status || 2,
    priority: payload.priority || 1,
    tenant_id: payload.tenant_id || 'hmadv',
  };
}

export function normalizeResendEmail(payload = {}) {
  return {
    to: payload.to || null,
    subject: payload.subject || '',
    template: payload.template || 'notification',
    tenant_id: payload.tenant_id || 'hmadv',
  };
}

export function normalizeAutentiqueSignature(payload = {}) {
  return {
    autentique_id: payload.autentique_id || payload.id || null,
    document_id: payload.document_id || null,
    status: payload.status || 'pending',
    tenant_id: payload.tenant_id || 'hmadv',
  };
}
