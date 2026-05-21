import { describe, expect, it } from 'vitest';
import {
  createSubscription,
  updateSubscription,
  generateTenantInvoice,
  createPaymentForInvoice,
} from '../billing/subscriptions/BillingLifecycleService.js';

describe('billing lifecycle foundation', () => {
  it('creates and updates tenant subscriptions', () => {
    const created = createSubscription('tenant-x', 'starter');
    const updated = updateSubscription('tenant-x', 'professional');

    expect(created.tenant_id).toBe('tenant-x');
    expect(updated.plan_code).toBe('professional');
  });

  it('generates invoice and payment attempt foundations', () => {
    const invoice = generateTenantInvoice('tenant-y', 12.5);
    const payment = createPaymentForInvoice(invoice);

    expect(invoice.tenant_id).toBe('tenant-y');
    expect(invoice.amount).toBe(12.5);
    expect(payment.invoice_id).toBe(invoice.id);
  });
});
