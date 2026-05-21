import { existsSync } from 'node:fs';

const required = [
  'billing-os/README.md',
  'billing-os/BillingOSDomainModel.js',
  'billing-os/BillingOSFoundation.js',
  'billing-os/ShellBillingOSVisibility.js',
  'billing-os/subscriptions/SubscriptionEngine.js',
  'billing-os/plans/PlanEngine.js',
  'billing-os/checkout/CheckoutExperienceEngine.js',
  'billing-os/customers/CustomerBillingProfileEngine.js',
  'billing-os/payments/stripe/StripeFoundation.js',
  'billing-os/invoices/InvoiceFoundation.js',
  'billing-os/usage/UsageEngine.js',
  'billing-os/quotas/QuotaSystemEngine.js',
  'billing-os/credits/CreditSystemFoundation.js',
  'billing-os/wallet/WalletFoundation.js',
  'billing-os/commerce/CommerceFoundation.js',
  'billing-os/catalog/ProductCatalogFoundation.js',
  'billing-os/pricing/PricingEngine.js',
  'billing-os/discounts/DiscountEngine.js',
  'billing-os/coupons/CouponEngine.js',
  'billing-os/entitlements/EntitlementEngine.js',
  'billing-os/metering/MeteringEngine.js',
  'billing-os/analytics/BillingAnalyticsEngine.js',
  'billing-os/insights/CommercialIntelligenceEngine.js',
  'billing-os/telemetry/BillingTelemetryEngine.js',
  'billing-os/governance/BillingGovernanceEngine.js',
  'billing-os/docs/billing-os-foundation.md',
  'billing-os/governance/billing-os-governance.md',
  'shared/contracts/billing-os/BillingOSContracts.js',
  'shared/contracts/billing-os/SubscriptionPayloadContracts.js',
  'shared/contracts/billing-os/CheckoutPayloadContracts.js',
  'shared/contracts/billing-os/QuotaPayloadContracts.js',
  'shared/contracts/billing-os/InvoicePayloadContracts.js',
  'shared/contracts/billing-os/UsagePayloadContracts.js',
  'docs/billing-os/README.md',
  'docs/billing-os/subscriptions.md',
  'docs/billing-os/quotas.md',
  'docs/billing-os/usage.md',
  'docs/billing-os/plans.md',
  'docs/billing-os/pricing.md',
  'docs/billing-os/workflows.md',
  'docs/billing-os/telemetry.md',
  'governance/billing-os/pricing-standards.md',
  'governance/billing-os/billing-standards.md',
  'governance/billing-os/subscription-standards.md',
  'governance/billing-os/quota-standards.md',
  'governance/billing-os/monetization-standards.md',
  'governance/billing-os/ai-billing-governance.md',
  'governance/billing-os/module-requirements.md',
  'pages/billing-os.html',
  'admin/billing-os/index.html',
];

const missing = required.filter((item) => !existsSync(item));
if (missing.length) {
  console.error('validate:billing-os failed. Missing files:');
  missing.forEach((item) => console.error(`- ${item}`));
  process.exit(1);
}

console.log('validate:billing-os passed');
