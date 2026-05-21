export function createPaymentAttempt(invoice, { provider = 'stripe_future' } = {}) {
  return {
    id: `pay_${invoice?.id || Date.now()}`,
    invoice_id: invoice?.id || null,
    provider,
    status: 'pending_integration',
    retries: 0,
    created_at: new Date().toISOString(),
  };
}
