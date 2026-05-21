export function normalizeBillingInvoicePayload(payload = {}) {
  return {
    invoice_id: payload.invoice_id || null,
    tenant_id: payload.tenant_id || 'hmadv',
    amount_cents: Number(payload.amount_cents) || 0,
    status: payload.status || 'issued',
    due_at: payload.due_at || null,
    paid_at: payload.paid_at || null,
  };
}
