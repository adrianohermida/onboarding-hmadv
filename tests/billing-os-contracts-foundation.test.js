import { describe, expect, it } from 'vitest';
import { normalizeBillingSubscriptionPayload } from '../shared/contracts/billing-os/SubscriptionPayloadContracts.js';
import { normalizeBillingCheckoutPayload } from '../shared/contracts/billing-os/CheckoutPayloadContracts.js';
import { normalizeBillingQuotaPayload } from '../shared/contracts/billing-os/QuotaPayloadContracts.js';
import { normalizeBillingInvoicePayload } from '../shared/contracts/billing-os/InvoicePayloadContracts.js';
import { normalizeBillingUsagePayload } from '../shared/contracts/billing-os/UsagePayloadContracts.js';

describe('billing os contracts', () => {
  it('normalizes subscription and checkout payloads', () => {
    const subscription = normalizeBillingSubscriptionPayload({ tenant_id: 'tenant-x', plan_code: 'starter' });
    const checkout = normalizeBillingCheckoutPayload({ plan_code: 'professional', mode: 'upgrade' });

    expect(subscription.tenant_id).toBe('tenant-x');
    expect(checkout.plan_code).toBe('professional');
  });

  it('normalizes quota, invoice and usage payloads', () => {
    const quota = normalizeBillingQuotaPayload({ metric: 'ai_usage', used: 40, limit: 100 });
    const invoice = normalizeBillingInvoicePayload({ amount_cents: 12900, status: 'issued' });
    const usage = normalizeBillingUsagePayload({ ai_usage: 12, workflow_usage: 30 });

    expect(quota.metric).toBe('ai_usage');
    expect(invoice.amount_cents).toBe(12900);
    expect(usage.workflow_usage).toBe(30);
  });
});
