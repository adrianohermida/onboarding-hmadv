const usageStore = new Map();

function ensureTenant(tenant_id = 'hmadv') {
  if (!usageStore.has(tenant_id)) {
    usageStore.set(tenant_id, {
      ai_usage: 0,
      storage_usage_mb: 0,
      workflow_usage: 0,
      onboarding_usage: 0,
      integrations_usage: 0,
      analytics_usage: 0,
      users_usage: 0,
      clients_usage: 0,
      uploads_usage: 0,
    });
  }
  return usageStore.get(tenant_id);
}

class UsageEngine {
  record(tenant_id = 'hmadv', metric = 'workflow_usage', amount = 1) {
    const usage = ensureTenant(tenant_id);
    usage[metric] = (Number(usage[metric]) || 0) + Number(amount || 0);
    return usage[metric];
  }

  snapshot(tenant_id = 'hmadv') {
    return { ...ensureTenant(tenant_id) };
  }
}

export const usageEngine = new UsageEngine();
