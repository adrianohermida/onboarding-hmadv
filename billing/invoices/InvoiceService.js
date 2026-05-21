const invoices = new Map();

export function generateInvoice({ tenant_id, cycle, usage_cost_total, currency = 'BRL' }) {
  const id = `inv_${tenant_id}_${Date.now()}`;
  const invoice = {
    id,
    tenant_id,
    cycle,
    amount: Number(usage_cost_total || 0),
    currency,
    status: 'generated',
    created_at: new Date().toISOString(),
  };
  invoices.set(id, invoice);
  return invoice;
}

export function listInvoices(tenantId) {
  const list = [...invoices.values()];
  return tenantId ? list.filter((item) => item.tenant_id === tenantId) : list;
}
