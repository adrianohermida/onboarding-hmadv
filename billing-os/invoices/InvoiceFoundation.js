class InvoiceFoundation {
  constructor() {
    this._items = [];
  }

  register(payload = {}) {
    const item = {
      invoice_id: payload.invoice_id || `inv_${Date.now()}`,
      tenant_id: payload.tenant_id || 'hmadv',
      amount_cents: Number(payload.amount_cents) || 0,
      status: payload.status || 'issued',
      due_at: payload.due_at || null,
      paid_at: payload.paid_at || null,
      timestamp: new Date().toISOString(),
    };
    this._items.unshift(item);
    return item;
  }

  snapshot(tenant_id = 'hmadv') {
    const list = this._items.filter((entry) => entry.tenant_id === tenant_id);
    return {
      total: list.length,
      paid: list.filter((entry) => entry.status === 'paid').length,
      overdue: list.filter((entry) => entry.status === 'overdue').length,
      pending: list.filter((entry) => entry.status === 'issued' || entry.status === 'pending').length,
      list,
    };
  }
}

export const invoiceFoundation = new InvoiceFoundation();
