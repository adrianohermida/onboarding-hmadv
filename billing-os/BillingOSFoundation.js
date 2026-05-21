import { bus } from '../modules/events/EventBus.js';
import { buildTenantBillingSnapshot } from '../billing/BillingFoundation.js';
import { listBillingOsDomainEntities } from './BillingOSDomainModel.js';
import { planEngine } from './plans/PlanEngine.js';
import { subscriptionEngine } from './subscriptions/SubscriptionEngine.js';
import { entitlementEngine } from './entitlements/EntitlementEngine.js';
import { usageEngine } from './usage/UsageEngine.js';
import { quotaSystemEngine } from './quotas/QuotaSystemEngine.js';
import { checkoutExperienceEngine } from './checkout/CheckoutExperienceEngine.js';
import { stripeFoundation } from './payments/stripe/StripeFoundation.js';
import { customerBillingProfileEngine } from './customers/CustomerBillingProfileEngine.js';
import { invoiceFoundation } from './invoices/InvoiceFoundation.js';
import { commerceFoundation } from './commerce/CommerceFoundation.js';
import { productCatalogFoundation } from './catalog/ProductCatalogFoundation.js';
import { pricingEngine } from './pricing/PricingEngine.js';
import { discountEngine } from './discounts/DiscountEngine.js';
import { couponEngine } from './coupons/CouponEngine.js';
import { creditSystemFoundation } from './credits/CreditSystemFoundation.js';
import { walletFoundation } from './wallet/WalletFoundation.js';
import { meteringEngine } from './metering/MeteringEngine.js';
import { billingAnalyticsEngine } from './analytics/BillingAnalyticsEngine.js';
import { commercialIntelligenceEngine } from './insights/CommercialIntelligenceEngine.js';
import { billingTelemetryEngine } from './telemetry/BillingTelemetryEngine.js';
import { billingGovernanceEngine } from './governance/BillingGovernanceEngine.js';

let mounted = false;
let offs = [];

function trace(category, name, payload = {}, envelope = {}) {
  billingTelemetryEngine.track({
    tenant_id: envelope.tenant_id || payload.tenant_id || 'hmadv',
    category,
    name,
    value: Number(payload.value) || 1,
    failed: payload.failed === true,
    degraded: payload.degraded === true,
    trace_id: envelope.trace_id || envelope.correlation_id || null,
  });
}

function workflowAlerts(tenant_id = 'hmadv', quotas = {}) {
  if (quotas.storage?.state === 'warning') bus.emit('trial.expiring', { tenant_id, message: 'Storage proximo do limite' });
  if (quotas.storage?.state === 'exceeded') bus.emit('quota.exceeded', { tenant_id, metric: 'storage' });
}

export function mountBillingOSFoundation() {
  if (mounted) return;
  mounted = true;

  offs = [
    bus.on('subscription.created', (payload, envelope) => {
      subscriptionEngine.create(payload);
      trace('subscription', 'subscription.created', payload, envelope);
    }),
    bus.on('subscription.upgraded', (payload, envelope) => {
      subscriptionEngine.upgrade(payload.tenant_id || 'hmadv', payload.target_plan || 'professional');
      trace('subscription', 'subscription.upgraded', payload, envelope);
    }),
    bus.on('subscription.downgraded', (payload, envelope) => {
      subscriptionEngine.downgrade(payload.tenant_id || 'hmadv', payload.target_plan || 'starter');
      trace('subscription', 'subscription.downgraded', payload, envelope);
    }),
    bus.on('payment.failed', (payload, envelope) => {
      trace('payment', 'payment.failed', { ...payload, failed: true }, envelope);
    }),
    bus.on('invoice.issued', (payload, envelope) => {
      invoiceFoundation.register(payload);
      trace('invoice', 'invoice.issued', payload, envelope);
    }),
    bus.on('workflow.executed', (payload, envelope) => {
      usageEngine.record(payload.tenant_id || 'hmadv', 'workflow_usage', 1);
      trace('usage', 'workflow.executed', payload, envelope);
    }),
    bus.on('document.uploaded', (payload, envelope) => {
      usageEngine.record(payload.tenant_id || 'hmadv', 'uploads_usage', 1);
      trace('usage', 'document.uploaded', payload, envelope);
    }),
    bus.on('ai.response.generated', (payload, envelope) => {
      usageEngine.record(payload.tenant_id || 'hmadv', 'ai_usage', 1);
      trace('usage', 'ai.response.generated', payload, envelope);
    }),
  ];
}

export function unmountBillingOSFoundation() {
  offs.forEach((off) => {
    try { off(); } catch (_) {}
  });
  offs = [];
  mounted = false;
}

export function collectBillingOSSnapshot(tenant_id = 'hmadv') {
  const legacyBilling = buildTenantBillingSnapshot(tenant_id);
  const subscription = subscriptionEngine.get(tenant_id);
  const entitlements = entitlementEngine.resolve(subscription);
  const usage = usageEngine.snapshot(tenant_id);
  const quotas = quotaSystemEngine.evaluate(entitlements, usage);
  const invoices = invoiceFoundation.snapshot(tenant_id);
  const telemetry = billingTelemetryEngine.snapshot(tenant_id);

  workflowAlerts(tenant_id, quotas);

  const checkout = checkoutExperienceEngine.start({ tenant_id, plan_code: subscription.plan_code, mode: 'self-serve' });
  const stripe_checkout = stripeFoundation.createCheckoutSession({ tenant_id, plan_code: subscription.plan_code, mode: 'subscription' });
  const stripe_intent = stripeFoundation.createPaymentIntent({ tenant_id, amount_cents: pricingEngine.table().plans[subscription.plan_code] || 0 });

  const customer = customerBillingProfileEngine.build({
    tenant_id,
    subscription,
    invoices: invoices.list,
    usage,
    entitlements,
    payment_methods: ['card', 'pix_future', 'boleto_future', 'wallet_future'],
  });

  return {
    domain_entities: listBillingOsDomainEntities(),
    plans: { current: subscription.plan_code, catalog: planEngine.list() },
    subscriptions: { ...subscription, tenant_subscriptions_ready: true },
    checkout,
    customers: customer,
    payments: { stripe_foundation: true, checkout_session: stripe_checkout, payment_intent: stripe_intent },
    invoices,
    usage,
    quotas,
    credits: creditSystemFoundation.snapshot(),
    wallet: walletFoundation.snapshot(),
    commerce: commerceFoundation.snapshot(),
    catalog: productCatalogFoundation.snapshot(),
    pricing: pricingEngine.table(),
    discounts: discountEngine.snapshot(),
    coupons: couponEngine.snapshot(),
    entitlements,
    metering: meteringEngine.snapshot({ metered_events: usage.workflow_usage + usage.ai_usage + usage.uploads_usage }),
    analytics: billingAnalyticsEngine.snapshot({
      revenue_cents: invoices.list.filter((entry) => entry.status === 'paid').reduce((acc, entry) => acc + entry.amount_cents, 0),
      subscriptions: 1,
      churn_risk: telemetry.failed,
      upgrades: telemetry.upgrades,
      usage_pressure: Object.values(quotas).filter((entry) => entry.state !== 'ok').length,
      onboarding_conversion: usage.onboarding_usage,
      ai_consumption: usage.ai_usage,
    }),
    insights: commercialIntelligenceEngine.snapshot({
      churn_risk: telemetry.failed > 0 ? 'medium' : 'low',
      upsell_opportunities: Object.values(quotas).some((entry) => entry.state === 'warning') ? ['upgrade.professional'] : [],
      usage_spikes: Object.entries(usage).filter(([, value]) => Number(value) > 1000).map(([key]) => key),
      enterprise_opportunities: subscription.plan_code === 'professional' ? ['enterprise.migration'] : [],
    }),
    telemetry,
    observability: {
      payment_failures: telemetry.list.filter((entry) => entry.name === 'payment.failed').length,
      webhook_failures: telemetry.list.filter((entry) => entry.name === 'payment.webhook.failed').length,
      quota_failures: Object.values(quotas).filter((entry) => entry.state === 'exceeded').length,
      subscription_failures: telemetry.list.filter((entry) => entry.name === 'subscription.failed').length,
      billing_degradation: telemetry.degraded,
    },
    governance: billingGovernanceEngine.evaluate({}),
    legacy_billing_bridge: legacyBilling,
    generated_at: new Date().toISOString(),
  };
}

export const billingOsFoundation = {
  mount: mountBillingOSFoundation,
  unmount: unmountBillingOSFoundation,
  snapshot: collectBillingOSSnapshot,
};
