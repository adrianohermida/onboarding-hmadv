export class TenantAnalyticsEngine {
  snapshot(payload = {}) {
    return {
      active_tenants: Number(payload.active_tenants) || 0,
      onboarding_tenants: Number(payload.onboarding_tenants) || 0,
      consumption_index: Number(payload.consumption_index) || 0,
      productivity_index: Number(payload.productivity_index) || 0,
      risk_index: Number(payload.risk_index) || 0,
      retention_index: Number(payload.retention_index) || 0,
      generated_at: new Date().toISOString(),
    };
  }
}

export const tenantAnalyticsEngine = new TenantAnalyticsEngine();
