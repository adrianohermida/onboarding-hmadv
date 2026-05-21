export function normalizeBillingUsagePayload(payload = {}) {
  return {
    tenant_id: payload.tenant_id || 'hmadv',
    ai_usage: Number(payload.ai_usage) || 0,
    storage_usage_mb: Number(payload.storage_usage_mb) || 0,
    workflow_usage: Number(payload.workflow_usage) || 0,
    onboarding_usage: Number(payload.onboarding_usage) || 0,
    integrations_usage: Number(payload.integrations_usage) || 0,
    analytics_usage: Number(payload.analytics_usage) || 0,
  };
}
