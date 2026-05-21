export function normalizeBillingQuotaPayload(payload = {}) {
  return {
    tenant_id: payload.tenant_id || 'hmadv',
    metric: payload.metric || 'workflow_usage',
    used: Number(payload.used) || 0,
    limit: Number(payload.limit) || 0,
    state: payload.state || 'ok',
  };
}
