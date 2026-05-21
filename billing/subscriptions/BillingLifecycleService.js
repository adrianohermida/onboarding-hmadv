import { bus } from '../../modules/events/EventBus.js';
import { updateTenantPlan, getTenantSubscription } from './SubscriptionService.js';
import { generateInvoice } from '../invoices/InvoiceService.js';
import { createPaymentAttempt } from '../payments/PaymentGatewayFoundation.js';

export function createSubscription(tenantId, planCode = 'starter') {
  const subscription = updateTenantPlan(tenantId, planCode);
  bus.emit('subscription.created', { tenant_id: tenantId, plan_code: planCode, status: subscription.status }, { tenant_id: tenantId });
  return subscription;
}

export function updateSubscription(tenantId, planCode) {
  const subscription = updateTenantPlan(tenantId, planCode);
  bus.emit('subscription.updated', { tenant_id: tenantId, plan_code: planCode, status: subscription.status }, { tenant_id: tenantId });
  return subscription;
}

export function generateTenantInvoice(tenantId, usageCostTotal) {
  const subscription = getTenantSubscription(tenantId);
  const invoice = generateInvoice({
    tenant_id: tenantId,
    cycle: subscription.cycle,
    usage_cost_total: usageCostTotal,
  });
  bus.emit('invoice.generated', { invoice_id: invoice.id, amount: invoice.amount }, { tenant_id: tenantId });
  return invoice;
}

export function createPaymentForInvoice(invoice) {
  const payment = createPaymentAttempt(invoice);
  if (payment.status === 'pending_integration') {
    bus.emit('payment.received', { invoice_id: invoice.id, payment_id: payment.id, status: payment.status }, { tenant_id: invoice.tenant_id });
  }
  return payment;
}
