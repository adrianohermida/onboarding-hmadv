import { describe, expect, it } from 'vitest';
import { subscriptionEngine } from '../billing-os/subscriptions/SubscriptionEngine.js';
import { usageEngine } from '../billing-os/usage/UsageEngine.js';
import { billingOsFoundation } from '../billing-os/BillingOSFoundation.js';

describe('billing os foundation', () => {
  it('builds snapshot with plans, subscriptions and quotas', () => {
    subscriptionEngine.create({ tenant_id: 'tenant-billing', plan_code: 'professional', status: 'active' });
    usageEngine.record('tenant-billing', 'workflow_usage', 10);
    usageEngine.record('tenant-billing', 'ai_usage', 5);

    const snapshot = billingOsFoundation.snapshot('tenant-billing');

    expect(snapshot.domain_entities.length).toBeGreaterThan(8);
    expect(snapshot.subscriptions.plan_code).toBe('professional');
    expect(snapshot.quotas.workflows.limit).toBeGreaterThan(0);
    expect(snapshot.payments.stripe_foundation).toBe(true);
  });

  it('enforces monetization governance and tenant safety', () => {
    const snapshot = billingOsFoundation.snapshot('tenant-billing');

    expect(snapshot.governance.billing_standards).toBe(true);
    expect(snapshot.governance.ai_cannot_unlock_resources_without_billing).toBe(true);
    expect(snapshot.governance.tenancy_required).toBe(true);
  });
});
