const usageStore = new Map();

function getTenantUsage(tenantId = 'hmadv') {
  if (!usageStore.has(tenantId)) usageStore.set(tenantId, {});
  return usageStore.get(tenantId);
}

export function recordUsage(tenantId, metricKey, amount = 1) {
  const usage = getTenantUsage(tenantId);
  usage[metricKey] = (Number(usage[metricKey]) || 0) + Number(amount || 0);
  return usage[metricKey];
}

export function snapshotUsage(tenantId = 'hmadv') {
  return { ...(getTenantUsage(tenantId) || {}) };
}
