class QuotaSystemEngine {
  evaluate(entitlements = {}, usage = {}) {
    const limits = entitlements.limits || {};
    return {
      users: this._entry(usage.users_usage, limits.max_users),
      clients: this._entry(usage.clients_usage, limits.max_clients),
      workflows: this._entry(usage.workflow_usage, limits.max_workflows),
      ai: this._entry(usage.ai_usage, limits.max_ai_requests),
      storage: this._entry(usage.storage_usage_mb, limits.storage_mb),
      uploads: this._entry(usage.uploads_usage, limits.monthly_uploads),
      analytics: this._entry(usage.analytics_usage, limits.analytics_dashboards),
      integrations: this._entry(usage.integrations_usage, limits.integrations),
    };
  }

  _entry(used = 0, limit = 0) {
    const safeLimit = Number(limit) || 0;
    const safeUsed = Number(used) || 0;
    const ratio = safeLimit > 0 ? safeUsed / safeLimit : 0;
    return {
      used: safeUsed,
      limit: safeLimit,
      ratio,
      state: ratio >= 1 ? 'exceeded' : (ratio >= 0.8 ? 'warning' : 'ok'),
    };
  }
}

export const quotaSystemEngine = new QuotaSystemEngine();
