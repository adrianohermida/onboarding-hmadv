export const TenantSubscriptionContract = {
  required: ['tenant_id', 'plan_code', 'status', 'cycle'],
};

export const UsageMetricContract = {
  required: ['tenant_id', 'metric', 'value', 'timestamp'],
};

export const QuotaLimitContract = {
  required: ['tenant_id', 'metric', 'limit', 'used', 'usage_pct'],
};

export const InvoiceContract = {
  required: ['id', 'tenant_id', 'amount', 'currency', 'status'],
};

export const PaymentContract = {
  required: ['id', 'invoice_id', 'provider', 'status'],
};

export const FeatureEntitlementContract = {
  required: ['tenant_id', 'plan_code', 'features', 'limits'],
};
