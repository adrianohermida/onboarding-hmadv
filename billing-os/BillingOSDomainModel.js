const BILLING_OS_DOMAIN_ENTITIES = [
  'BillingSubscriptionRecord',
  'BillingPlanDefinition',
  'BillingCheckoutSession',
  'BillingCustomerProfile',
  'BillingPaymentRecord',
  'BillingInvoiceRecord',
  'BillingUsageRecord',
  'BillingQuotaState',
  'BillingEntitlementState',
  'BillingCreditLedger',
  'BillingCatalogItem',
  'BillingPricingTable',
  'BillingDiscountPolicy',
  'BillingTelemetryRecord',
  'BillingAnalyticsSnapshot',
  'BillingCommercialInsight',
];

export function listBillingOsDomainEntities() {
  return [...BILLING_OS_DOMAIN_ENTITIES];
}

export default BILLING_OS_DOMAIN_ENTITIES;
