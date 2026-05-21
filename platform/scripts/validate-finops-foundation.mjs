import { existsSync } from 'node:fs';

const required = [
  'billing/README.md',
  'billing/plans/PlanCatalog.js',
  'billing/subscriptions/SubscriptionService.js',
  'billing/usage/UsageTracker.js',
  'billing/quotas/QuotaEngine.js',
  'billing/limits/LimitEngine.js',
  'billing/entitlements/EntitlementEngine.js',
  'billing/metrics/FinOpsMetrics.js',
  'billing/costs/CostModel.js',
  'billing/invoices/InvoiceService.js',
  'billing/payments/PaymentGatewayFoundation.js',
  'billing/events/BillingEvents.js',
  'billing/events/BillingUsageSubscribers.js',
  'billing/telemetry/BillingTelemetry.js',
  'billing/BillingFoundation.js',
  'billing/ShellBillingIntegration.js',
  'shared/contracts/billing/BillingContracts.js',
  'docs/billing/README.md',
  'docs/billing/plans.md',
  'docs/billing/quotas.md',
  'docs/billing/usage.md',
  'docs/billing/metrics.md',
  'docs/billing/subscriptions.md',
  'docs/billing/invoices.md',
  'docs/billing/payments.md',
  'docs/billing/feature-entitlements.md',
  'docs/billing/telemetry.md',
  'docs/billing/tenant-economics.md',
  'governance/finops/finops-governance.md',
  'governance/finops/billing-security.md',
  'governance/finops/ai-billing-governance.md',
  'governance/finops/quotas-and-limits.md',
  'governance/finops/feature-flag-governance.md',
  'governance/finops/operational-monitoring.md',
  'admin/finops/index.html',
];

const missing = required.filter((item) => !existsSync(item));
if (missing.length) {
  console.error('validate:finops failed. Missing files:');
  missing.forEach((item) => console.error(`- ${item}`));
  process.exit(1);
}

console.log('validate:finops passed');
